import { GeoJsonLayer } from '@deck.gl/layers';
import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';
import { resolveStyle, toRGBA } from '../style-helpers';

export class WFSAdapter implements LayerAdapter {
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any {
    const style = config.file_metadata?.style;
    const poly = resolveStyle(style, 'Polygon');
    const line = resolveStyle(style, 'LineString');
    const point = resolveStyle(style, 'Point');

    return new GeoJsonLayer({
      id: `deck-wfs-${config.layer_id}`,
      data: config.tile_url,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: line.strokeWidth,
      pointRadiusMinPixels: point.pointRadius,
      getLineColor: toRGBA(line.strokeColor, line.opacity),
      getFillColor: toRGBA(poly.fillColor, poly.opacity),
    } as any);
  }

  async getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult> {
    return { type: 'none' };
  }

  supportsQueryFeatures(): boolean {
    return false;
  }
}
