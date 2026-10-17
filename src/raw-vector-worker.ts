import type {
  RawVectorFeatureCollection,
  RawVectorWorkerRequest,
  RawVectorWorkerResponse,
} from './raw-vector-protocol';
import { parseShapefileZip } from './shapefile-parser';

interface GeoPackageSrs {
  organization: string;
  organization_coordsys_id: number;
}

interface GeoPackageFeatureDao {
  srs: GeoPackageSrs;
  queryForEach(): Iterable<unknown>;
  getRow(row: unknown): unknown;
}

interface GeoPackageHandle {
  getFeatureTables(): string[];
  getFeatureDao(name: string): GeoPackageFeatureDao;
  close(): void;
}

interface GeoPackageModule {
  GeoPackageAPI: { open(input: Uint8Array): Promise<GeoPackageHandle> };
  GeoPackage: { parseFeatureRowIntoGeoJSON(row: unknown, srs: GeoPackageSrs): Record<string, unknown> };
  setSqljsWasmLocateFile(callback: (file: string) => string): void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function selectSourceLayer(available: string[], selected: string | undefined, format: string): string {
  if (selected) {
    if (available.includes(selected)) return selected;
    throw new Error(`${format} source_layer '${selected}' was not found. Available layers: ${available.join(', ')}.`);
  }
  if (available.length === 1) return available[0];
  if (available.length === 0) throw new Error(`${format} source contains no feature layers.`);
  throw new Error(`${format} source has multiple layers (${available.join(', ')}). Set source_layer explicitly.`);
}

function assertGeoPackageCrs(srs: GeoPackageSrs, sourceLayer: string): void {
  const organization = srs.organization?.toUpperCase();
  const code = srs.organization_coordsys_id;
  if (organization === 'EPSG' && (code === 4326 || code === 3857)) return;
  throw new Error(`GeoPackage layer '${sourceLayer}' uses ${organization ?? 'unknown'}:${code ?? 'unknown'}. Only EPSG:4326 and EPSG:3857 are supported.`);
}

function assertFeatureCount(features: Array<Record<string, unknown>>, maxFeatures: number): void {
  if (features.length > maxFeatures) {
    throw new Error(`Source has ${features.length.toLocaleString()} features, exceeding the ${maxFeatures.toLocaleString()} feature limit.`);
  }
}

function estimateBytes(data: RawVectorFeatureCollection): number {
  return new TextEncoder().encode(JSON.stringify(data)).byteLength;
}

async function parseShapefile(buffer: ArrayBuffer, request: RawVectorWorkerRequest): Promise<RawVectorFeatureCollection> {
  return parseShapefileZip(buffer, request.sourceLayer, request.maxFeatures);
}

async function parseGeoPackage(buffer: ArrayBuffer, request: RawVectorWorkerRequest): Promise<RawVectorFeatureCollection> {
  const module = await import('@ngageoint/geopackage') as unknown as GeoPackageModule;
  module.setSqljsWasmLocateFile(() => new URL('./sql-wasm.wasm', import.meta.url).toString());
  const geoPackage = await module.GeoPackageAPI.open(new Uint8Array(buffer));
  try {
    const sourceLayer = selectSourceLayer(geoPackage.getFeatureTables(), request.sourceLayer, 'GeoPackage');
    const featureDao = geoPackage.getFeatureDao(sourceLayer);
    assertGeoPackageCrs(featureDao.srs, sourceLayer);

    const features: Array<Record<string, unknown>> = [];
    for (const row of featureDao.queryForEach()) {
      features.push(module.GeoPackage.parseFeatureRowIntoGeoJSON(featureDao.getRow(row), featureDao.srs));
      if (features.length > request.maxFeatures) {
        throw new Error(`Source has more than ${request.maxFeatures.toLocaleString()} features.`);
      }
    }
    return { type: 'FeatureCollection', features };
  } finally {
    geoPackage.close();
  }
}

async function load(request: RawVectorWorkerRequest): Promise<RawVectorFeatureCollection> {
  const response = await fetch(request.url, request.requestInit);
  if (!response.ok) throw new Error(`Failed to fetch source (${response.status} ${response.statusText}).`);

  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > request.maxSourceBytes) {
    throw new Error(`Source is ${contentLength.toLocaleString()} bytes, exceeding the ${request.maxSourceBytes.toLocaleString()} byte limit.`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > request.maxSourceBytes) {
    throw new Error(`Source is ${buffer.byteLength.toLocaleString()} bytes, exceeding the ${request.maxSourceBytes.toLocaleString()} byte limit.`);
  }

  return request.layerType === 'shp'
    ? parseShapefile(buffer, request)
    : parseGeoPackage(buffer, request);
}

self.addEventListener('message', (event: MessageEvent<RawVectorWorkerRequest>) => {
  const request = event.data;
  void load(request).then((data) => {
    const response: RawVectorWorkerResponse = {
      id: request.id,
      ok: true,
      featureCount: data.features.length,
      estimatedBytes: estimateBytes(data),
      data,
    };
    self.postMessage(response);
  }).catch((error: unknown) => {
    const response: RawVectorWorkerResponse = { id: request.id, ok: false, error: errorMessage(error) };
    self.postMessage(response);
  });
});
