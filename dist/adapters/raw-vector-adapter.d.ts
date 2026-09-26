import type { LayerAdapter } from './types';
import type { FeatureInfoResult, LayerConfig } from '../types';
/** Renders browser-loaded SHP ZIP and GeoPackage feature data through GeoJsonLayer. */
export declare class RawVectorAdapter implements LayerAdapter {
    createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any;
    getInfo(_config: LayerConfig, _coordinate: [number, number]): Promise<FeatureInfoResult>;
    supportsQueryFeatures(): boolean;
}
//# sourceMappingURL=raw-vector-adapter.d.ts.map