import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';

export class TileAdapter implements LayerAdapter {
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any {
    return new TileLayer({
      id: `deck-tile-${config.layer_id}`,
      data: config.tile_url,
      tileSize: 256,
      pickable: true,
      opacity: config.opacity ?? 0.8,
      renderSubLayers: (props: any) => {
        const { west, south, east, north } = props.tile.bbox;
        return new BitmapLayer(props, {
          data: undefined,
          image: props.data,
          bounds: [west, south, east, north],
        });
      },
    });
  }

  async getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult> {
    // Raster tiles not queryable at point level
    return { type: 'none' };
  }

  supportsQueryFeatures(): boolean {
    return false;
  }
}
