import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
const WEB_MERCATOR_RESOLUTION_AT_ZOOM_0 = 156543.03392804097;
// GeoServer ships this GridSet; WebMercatorQuad is the historical default for
// third-party WMTS services, so only managed layers switch the default.
const GEOSERVER_TILEMATRIXSET = 'EPSG:900913';
const EXTERNAL_TILEMATRIXSET = 'WebMercatorQuad';
/**
 * GeoWebCache GridSet level whose resolution matches a Web Mercator zoom.
 * A GridSet may start at another base level, so the level comes from the
 * GridSet resolutions instead of assuming `level === zoom`.
 */
export function resolveTileMatrixLevel(zoom, resolutions) {
    if (!resolutions?.length)
        return zoom;
    const offset = Math.round(Math.log2(resolutions[0] / WEB_MERCATOR_RESOLUTION_AT_ZOOM_0));
    return Math.min(Math.max(zoom + offset, 0), resolutions.length - 1);
}
export function buildWmtsTileUrl(baseUrl, metadata, z, x, y) {
    const layer = metadata?.layer || metadata?.layers || metadata?.geoserver?.layer_name || 'default';
    const tilematrixset = metadata?.tilematrixset ||
        (metadata?.geoserver?.layer_name ? GEOSERVER_TILEMATRIXSET : EXTERNAL_TILEMATRIXSET);
    const format = metadata?.format || 'image/png';
    const level = resolveTileMatrixLevel(z, metadata?.tilematrixset_resolutions);
    const query = new URLSearchParams({
        SERVICE: 'WMTS',
        REQUEST: 'GetTile',
        VERSION: '1.0.0',
        LAYER: layer,
        TILEMATRIXSET: tilematrixset,
        TILEMATRIX: `${tilematrixset}:${level}`,
        TILEROW: String(y),
        TILECOL: String(x),
        FORMAT: format,
    });
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${query.toString()}`;
}
export class WMTSAdapter {
    createDeckLayer(config) {
        return new TileLayer({
            id: `deck-wmts-${config.layer_id}`,
            data: [],
            tileSize: 256,
            pickable: true,
            opacity: config.opacity ?? 0.8,
            getTileData: async ({ index }) => {
                const url = buildWmtsTileUrl(config.tile_url, config.file_metadata, index.z, index.x, index.y);
                const resp = await fetch(url);
                if (!resp.ok)
                    return null;
                return resp.blob().then(createImageBitmap);
            },
            renderSubLayers: (props) => {
                const bbox = props.tile.bbox;
                if (!('west' in bbox))
                    return null;
                const { data: _tileData, tile: _tile, ...subLayerProps } = props;
                return new BitmapLayer(subLayerProps, {
                    data: undefined,
                    image: props.data,
                    bounds: [bbox.west, bbox.south, bbox.east, bbox.north],
                });
            },
        });
    }
    async getInfo(_config, _coordinate) {
        return { type: 'none' };
    }
    supportsQueryFeatures() {
        return false;
    }
}
//# sourceMappingURL=wmts-adapter.js.map