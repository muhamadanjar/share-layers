import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';

function buildWmtsTileUrl(baseUrl: string, params: Record<string, string>, z: number, x: number, y: number): string {
  const layer = params.layer || 'default';
  const tms = params.tilematrixset || 'WebMercatorQuad';
  const format = params.format || 'image/png';

  return `${baseUrl}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&TILEMATRIXSET=${tms}&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=${format}`;
}

export class WMTSAdapter implements LayerAdapter {
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any {
    return new TileLayer({
      id: `deck-wmts-${config.layer_id}`,
      data: [],
      tileSize: 256,
      pickable: true,
      opacity: config.opacity ?? 0.8,
      getTileData: async (props: any) => {
        const { x, y, z } = props;
        const url = buildWmtsTileUrl(config.tile_url, (config.file_metadata || {}) as Record<string, string>, z, x, y);
        const resp = await fetch(url);
        if (!resp.ok) return null;
        return resp.blob().then(createImageBitmap);
      },
      renderSubLayers: (props: any) => {
        const { west, south, east, north } = props.tile.bbox;
        return new BitmapLayer(props, {
          data: undefined,
          image: props.data,
          bounds: [west, south, east, north],
        });
      },
    } as any);
  }

  async getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult> {
    return { type: 'none' };
  }

  supportsQueryFeatures(): boolean {
    return false;
  }
}
