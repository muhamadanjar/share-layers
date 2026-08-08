import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';
export declare class EsriAdapter implements LayerAdapter {
    createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any;
    private createMapServerLayer;
    private createTileServerLayer;
    private createImageServerLayer;
    private createFeatureServerLayer;
    private createVectorTileServerLayer;
    getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult>;
    supportsQueryFeatures(): boolean;
}
//# sourceMappingURL=esri-adapter.d.ts.map