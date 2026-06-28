import { GeoJsonLayer } from '@deck.gl/layers';
import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';
import { resolveStyle, toRGBA, makeFillColorAccessor } from '../style-helpers';

export class GeoJsonAdapter implements LayerAdapter {
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any {
    const style = config.file_metadata?.style;
    const poly = resolveStyle(style, 'Polygon');
    const line = resolveStyle(style, 'LineString');
    const point = resolveStyle(style, 'Point');
    const alpha = Math.round((poly.opacity ?? 0.7) * 255);

    return new GeoJsonLayer({
      id: `deck-geojson-${config.layer_id}`,
      data: config.tile_url,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: line.strokeWidth,
      pointRadiusMinPixels: point.pointRadius,
      getLineColor: toRGBA(line.strokeColor, line.opacity),
      getFillColor: makeFillColorAccessor(poly, alpha),
    } as any);
  }

  async getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult> {
    // GeoJSON features come from DeckGL click handler (properties in object)
    // No separate API call needed
    return { type: 'none' };
  }

  supportsQueryFeatures(): boolean {
    return false;
  }
}
