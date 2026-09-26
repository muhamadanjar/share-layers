import { GeoJsonLayer } from '@deck.gl/layers';
import { resolveStyle, toRGBA, makeFillColorAccessor } from '../style-helpers';
export function createStyledGeoJsonLayer(config, data, onClick, idPrefix = 'deck-geojson') {
    const style = config.file_metadata?.style;
    const poly = resolveStyle(style, 'Polygon');
    const line = resolveStyle(style, 'LineString');
    const point = resolveStyle(style, 'Point');
    const layerOpacity = config.opacity ?? 1;
    const alpha = Math.round((poly.opacity ?? 0.7) * layerOpacity * 255);
    return new GeoJsonLayer({
        id: `${idPrefix}-${config.layer_id}`,
        data,
        pickable: true,
        stroked: true,
        filled: true,
        lineWidthMinPixels: line.strokeWidth,
        pointRadiusMinPixels: point.pointRadius,
        getLineColor: toRGBA(line.strokeColor, (line.opacity ?? 1) * layerOpacity),
        getFillColor: makeFillColorAccessor(poly, alpha),
        onClick,
    });
}
export class GeoJsonAdapter {
    createDeckLayer(config, onClick) {
        return createStyledGeoJsonLayer(config, config.tile_url, onClick);
    }
    async getInfo(config, coordinate) {
        // GeoJSON features come from DeckGL click handler (properties in object)
        // No separate API call needed
        return { type: 'none' };
    }
    supportsQueryFeatures() {
        return false;
    }
}
//# sourceMappingURL=geojson-adapter.js.map