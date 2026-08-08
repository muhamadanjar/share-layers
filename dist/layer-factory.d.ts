import type { LayerType, LayerConfig } from './types';
import type { LayerAdapter } from './adapters/types';
export declare class LayerFactory {
    private adapters;
    constructor();
    private registerDefaultAdapters;
    register(type: LayerType, adapter: LayerAdapter): void;
    createLayer(config: LayerConfig, onClick?: (info: any) => void): any | null;
    getAdapter(type: LayerType): LayerAdapter | undefined;
}
export declare const layerFactory: LayerFactory;
//# sourceMappingURL=layer-factory.d.ts.map