import type { LayerConfig } from './types';
import type { RawVectorFeatureCollection } from './raw-vector-protocol';
export declare const DEFAULT_MAX_SOURCE_BYTES: number;
export declare const DEFAULT_MAX_FEATURES = 200000;
export declare const DEFAULT_CACHE_BYTES: number;
interface CachedSource {
    data: RawVectorFeatureCollection;
    featureCount: number;
    bytes: number;
}
export declare class RawVectorSourceCache {
    private readonly maxBytes;
    private readonly entries;
    private totalBytes;
    constructor(maxBytes?: number);
    get(key: string): CachedSource | undefined;
    set(key: string, entry: CachedSource): void;
    get size(): number;
}
/**
 * Resolves a raw SHP ZIP or GeoPackage source to a GeoJSON feature collection.
 * The promise is accepted by DeckGL's async data prop.
 */
export declare function loadRawVectorSource(config: LayerConfig): Promise<RawVectorFeatureCollection>;
export {};
//# sourceMappingURL=raw-vector-source.d.ts.map