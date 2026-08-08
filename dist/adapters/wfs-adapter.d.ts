import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';
export declare class WFSAdapter implements LayerAdapter {
    createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any;
    getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult>;
    supportsQueryFeatures(): boolean;
}
//# sourceMappingURL=wfs-adapter.d.ts.map