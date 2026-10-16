import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
function isGeoBoundingBox(bbox) {
    return 'west' in bbox && 'south' in bbox && 'east' in bbox && 'north' in bbox;
}
function buildWmsTileUrl(baseUrl, metadata, bbox) {
    const layers = metadata?.layers || metadata?.geoserver?.layer_name || 'default';
    const format = metadata?.format || 'image/png';
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
            getTileData: async ({ bbox }) => {
                if (!isGeoBoundingBox(bbox))
                    return null;
                const url = buildWmsTileUrl(config.tile_url, config.file_metadata, bbox);
                const resp = await fetch(url);
                if (!resp.ok)
                    return null;
                return resp.blob().then(createImageBitmap);
            },
            renderSubLayers: (props) => {
                const bbox = props.tile.bbox;
                if (!isGeoBoundingBox(bbox))
                    return null;
                const { west, south, east, north } = bbox;
                const { data: _tileData, tile: _tile, ...subLayerProps } = props;
                return new BitmapLayer(subLayerProps, {
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