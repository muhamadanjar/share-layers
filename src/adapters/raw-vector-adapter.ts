import type { LayerAdapter } from './types';
import type { FeatureInfoResult, LayerConfig } from '../types';
import { createStyledGeoJsonLayer } from './geojson-adapter';
import { loadRawVectorSource } from '../raw-vector-source';

/** Renders browser-loaded SHP ZIP and GeoPackage feature data through GeoJsonLayer. */
export class RawVectorAdapter implements LayerAdapter {
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any {
    return createStyledGeoJsonLayer(
      config,
      loadRawVectorSource(config),
      onClick,
      `deck-${config.layer_type}`,
    );
  }

  async getInfo(_config: LayerConfig, _coordinate: [number, number]): Promise<FeatureInfoResult> {
    return { type: 'none' };
  }

  supportsQueryFeatures(): boolean {
    return false;
  }
}
