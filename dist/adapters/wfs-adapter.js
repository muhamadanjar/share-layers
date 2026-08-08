import { GeoJsonLayer } from '@deck.gl/layers';
import { resolveStyle, toRGBA } from '../style-helpers';
export class WFSAdapter {
    createDeckLayer(config, onClick) {
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
        });
    }
    async getInfo(config, coordinate) {
        return { type: 'none' };
    }
    supportsQueryFeatures() {
        return false;
    }
}
//# sourceMappingURL=wfs-adapter.js.map