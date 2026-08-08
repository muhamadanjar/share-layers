import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';
export declare class TileAdapter implements LayerAdapter {
    createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any;
    getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult>;
    supportsQueryFeatures(): boolean;
}
//# sourceMappingURL=tile-adapter.d.ts.map