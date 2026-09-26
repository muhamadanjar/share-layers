export const DEFAULT_MAX_SOURCE_BYTES = 50 * 1024 * 1024;
export const DEFAULT_MAX_FEATURES = 200000;
export const DEFAULT_CACHE_BYTES = 100 * 1024 * 1024;
export class RawVectorSourceCache {
    constructor(maxBytes = DEFAULT_CACHE_BYTES) {
        this.maxBytes = maxBytes;
        this.entries = new Map();
        this.totalBytes = 0;
    }
    get(key) {
        const entry = this.entries.get(key);
        if (!entry)
            return undefined;
        this.entries.delete(key);
        this.entries.set(key, entry);
        return entry;
    }
    set(key, entry) {
        const existing = this.entries.get(key);
        if (existing)
            this.totalBytes -= existing.bytes;
        this.entries.delete(key);
        if (entry.bytes > this.maxBytes)
            return;
        while (this.totalBytes + entry.bytes > this.maxBytes) {
            const oldestKey = this.entries.keys().next().value;
            if (!oldestKey)
                break;
            const oldest = this.entries.get(oldestKey);
            this.entries.delete(oldestKey);
            this.totalBytes -= oldest?.bytes ?? 0;
        }
        this.entries.set(key, entry);
        this.totalBytes += entry.bytes;
    }
    get size() {
        return this.entries.size;
    }
}
const sourceCache = new RawVectorSourceCache();
const inFlightLoads = new Map();
function emitStatus(config, status) {
    config.onSourceStatus?.(status);
}
function getLayerType(config) {
    if (config.layer_type === 'shp' || config.layer_type === 'geopackage') {
        return config.layer_type;
    }
    throw new Error(`Raw vector loading is not available for layer type '${config.layer_type}'.`);
}
function getPositiveLimit(value, fallback, label) {
    const limit = value ?? fallback;
    if (!Number.isSafeInteger(limit) || limit <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }
    return limit;
}
function serializeRequestInit(requestInit) {
    if (!requestInit)
        return undefined;
    const headers = [];
    if (requestInit.headers) {
        new Headers(requestInit.headers).forEach((value, name) => headers.push([name, value]));
        headers.sort(([left], [right]) => left.localeCompare(right));
    }
    return {
        method: requestInit.method,
        headers: headers.length > 0 ? headers : undefined,
        credentials: requestInit.credentials,
        mode: requestInit.mode,
        cache: requestInit.cache,
        redirect: requestInit.redirect,
        referrerPolicy: requestInit.referrerPolicy,
        integrity: requestInit.integrity,
    };
}
function getRequest(config) {
    const layerType = getLayerType(config);
    const options = config.source_options;
    return {
        id: crypto.randomUUID(),
        layerType,
        url: config.tile_url,
        sourceLayer: config.source_layer,
        maxSourceBytes: getPositiveLimit(options?.max_source_bytes, DEFAULT_MAX_SOURCE_BYTES, 'max_source_bytes'),
        maxFeatures: getPositiveLimit(options?.max_features, DEFAULT_MAX_FEATURES, 'max_features'),
        requestInit: serializeRequestInit(options?.request_init),
    };
}
function getCacheKey(request) {
    return JSON.stringify({
        layerType: request.layerType,
        url: request.url,
        sourceLayer: request.sourceLayer,
        maxSourceBytes: request.maxSourceBytes,
        maxFeatures: request.maxFeatures,
        requestInit: request.requestInit,
    });
}
function runWorker(request) {
    if (typeof Worker === 'undefined') {
        return Promise.reject(new Error('Raw SHP and GeoPackage layers require a browser Web Worker.'));
    }
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./raw-vector-worker.js', import.meta.url), { type: 'module' });
        const cleanup = () => worker.terminate();
        worker.addEventListener('message', (event) => {
            const response = event.data;
            if (response.id !== request.id)
                return;
            cleanup();
            if (!response.ok) {
                reject(new Error(response.error));
                return;
            }
            resolve({
                data: response.data,
                featureCount: response.featureCount,
                bytes: response.estimatedBytes,
            });
        });
        worker.addEventListener('error', (event) => {
            cleanup();
            reject(new Error(event.message || 'Raw vector worker failed.'));
        });
        worker.addEventListener('messageerror', () => {
            cleanup();
            reject(new Error('Raw vector worker returned an unreadable response.'));
        });
        worker.postMessage(request);
    });
}
/**
 * Resolves a raw SHP ZIP or GeoPackage source to a GeoJSON feature collection.
 * The promise is accepted by DeckGL's async data prop.
 */
export function loadRawVectorSource(config) {
    let request;
    try {
        request = getRequest(config);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        emitStatus(config, { state: 'error', error: message });
        return Promise.reject(error);
    }
    const key = getCacheKey(request);
    const cached = sourceCache.get(key);
    if (cached) {
        emitStatus(config, { state: 'ready', featureCount: cached.featureCount });
        return Promise.resolve(cached.data);
    }
    emitStatus(config, { state: 'loading' });
    const pending = inFlightLoads.get(key) ?? runWorker(request).then((entry) => {
        sourceCache.set(key, entry);
        return entry;
    }).finally(() => {
        inFlightLoads.delete(key);
    });
    inFlightLoads.set(key, pending);
    return pending.then((entry) => {
        emitStatus(config, { state: 'ready', featureCount: entry.featureCount });
        return entry.data;
    }).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        emitStatus(config, { state: 'error', error: message });
        throw error;
    });
}
//# sourceMappingURL=raw-vector-source.js.map