import { TileLayer } from '@deck.gl/geo-layers';
import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult, FileMetadata } from '../types';
/**
 * GeoWebCache GridSet level whose resolution matches a Web Mercator zoom.
 * A GridSet may start at another base level, so the level comes from the
 * GridSet resolutions instead of assuming `level === zoom`.
 */
export declare function resolveTileMatrixLevel(zoom: number, resolutions?: number[]): number;
export declare function buildWmtsTileUrl(baseUrl: string, metadata: FileMetadata | undefined, z: number, x: number, y: number): string;
export declare class WMTSAdapter implements LayerAdapter {
    createDeckLayer(config: LayerConfig): TileLayer<ImageBitmap | null>;
    getInfo(_config: LayerConfig, _coordinate: [number, number]): Promise<FeatureInfoResult>;
    supportsQueryFeatures(): boolean;
}
//# sourceMappingURL=wmts-adapter.d.ts.map