import { layerFactory } from './layer-factory';
export async function getFeatureInfo(config, coordinate) {
    const adapter = layerFactory.getAdapter(config.layer_type);
    if (!adapter) {
        return { type: 'none' };
    }
    try {
        return await adapter.getInfo(config, coordinate);
    }
    catch (error) {
        console.warn(`[getFeatureInfo] Error for layer ${config.layer_id}:`, error);
        return { type: 'none' };
    }
}
//# sourceMappingURL=feature-info-provider.js.map