import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
function buildWmsTileUrl(baseUrl, params, bbox, z) {
    const layers = params.layers || 'default';
    const format = params.format || 'image/png';
    const queryParams = new URLSearchParams({
        SERVICE: 'WMS',
        REQUEST: 'GetMap',
        VERSION: '1.1.1',
        LAYERS: layers,
        WIDTH: '256',
        HEIGHT: '256',
        STYLES: '',
        TRANSPARENT: 'TRUE',
        CRS: 'EPSG:4326',
        FORMAT: format,
        BBOX: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
        SRS: 'EPSG:4326',
    });
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryParams.toString()}`;
}
export class WMSAdapter {
    createDeckLayer(config, onClick) {
        return new TileLayer({
            id: `deck-wms-${config.layer_id}`,
            data: [],
            tileSize: 256,
            pickable: true,
            opacity: config.opacity ?? 0.8,
            getTileData: async (props) => {
                const { x, y, z, bbox } = props;
                const url = buildWmsTileUrl(config.tile_url, (config.file_metadata || {}), bbox, z);
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
        return true;
    }
}
//# sourceMappingURL=wms-adapter.js.map