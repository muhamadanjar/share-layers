import type { LayerConfig, FeatureInfoResult } from './types';
import { layerFactory } from './layer-factory';

export async function getFeatureInfo(
  config: LayerConfig,
  coordinate: [number, number]
): Promise<FeatureInfoResult> {
  const adapter = layerFactory.getAdapter(config.layer_type);
  if (!adapter) {
    return { type: 'none' };
  }

  try {
    return await adapter.getInfo(config, coordinate);
  } catch (error) {
    console.warn(`[getFeatureInfo] Error for layer ${config.layer_id}:`, error);
    return { type: 'none' };
  }
}
