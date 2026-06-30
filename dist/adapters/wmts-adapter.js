import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
function buildWmtsTileUrl(baseUrl, params, z, x, y) {
    const layer = params.layer || 'default';
    const tms = params.tilematrixset || 'WebMercatorQuad';
    const format = params.format || 'image/png';
    return `${baseUrl}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&TILEMATRIXSET=${tms}&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=${format}`;
}
export class WMTSAdapter {
    createDeckLayer(config, onClick) {
        return new TileLayer({
            id: `deck-wmts-${config.layer_id}`,
            data: [],
            tileSize: 256,
            pickable: true,
            opacity: config.opacity ?? 0.8,
            getTileData: async (props) => {
                const { x, y, z } = props;
                const url = buildWmtsTileUrl(config.tile_url, (config.file_metadata || {}), z, x, y);
                const resp = await fetch(url);
                if (!resp.ok)
                    return null;
                return resp.blob().then(createImageBitmap);
            },
            renderSubLayers: (props) => {
                const { west, south, east, north } = props.tile.bbox;
                return new BitmapLayer(props, {
                    data: undefined,
                    image: props.data,
                    bounds: [west, south, east, north],
                });
            },
        });
    }
    async getInfo(config, coordinate) {
        return { type: 'none' };
    }
    supportsQueryFeatures() {
        return false;
    }
}
//# sourceMappingURL=wmts-adapter.js.map