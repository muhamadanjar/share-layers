import { GeoJsonLayer } from '@deck.gl/layers';
import { PathStyleExtension, FillStyleExtension } from '@deck.gl/extensions';
import { loadRawVectorSource } from '../raw-vector-source';
import { resolveStyle, makeFillColorAccessor, makeStrokeColorAccessor, DASH_ARRAYS, FILL_PATTERN_MAPPING, getFillPatternAtlas, } from '../style-helpers';
/** Renders browser-loaded SHP ZIP and GeoPackage feature data through GeoJsonLayer. */
export class RawVectorAdapter {
    createDeckLayer(config, onClick) {
        const style = config.file_metadata?.style;
        const poly = resolveStyle(style, 'Polygon');
        const line = resolveStyle(style, 'LineString');
        const point = resolveStyle(style, 'Point');
        const layerOpacity = config.opacity ?? 1;
        const polyStrokePattern = (poly.strokePattern ?? 'solid');
        const lineStrokePattern = (line.strokePattern ?? 'solid');
        const fillPattern = (poly.fillPattern ?? 'solid');
        const useFillPattern = fillPattern !== 'solid';
        const polyFill = makeFillColorAccessor(poly, Math.round((poly.opacity ?? 0.7) * layerOpacity * 255));
        const pointFill = makeFillColorAccessor(point, Math.round((point.opacity ?? 0.9) * layerOpacity * 255));
        const polyStroke = makeStrokeColorAccessor(poly, Math.round((poly.opacity ?? 1) * layerOpacity * 255));
        const lineStroke = makeStrokeColorAccessor(line, Math.round((line.opacity ?? 1) * layerOpacity * 255));
        const pointStroke = makeStrokeColorAccessor(point, Math.round((point.opacity ?? 1) * layerOpacity * 255));
        const getFillColor = (f) => {
            const t = f?.geometry?.type ?? '';
            const acc = t === 'Point' || t === 'MultiPoint' ? pointFill : polyFill;
            return typeof acc === 'function' ? acc(f) : acc;
        };
        const getLineColor = (f) => {
            const t = f?.geometry?.type ?? '';
            if (t === 'LineString' || t === 'MultiLineString')
                return typeof lineStroke === 'function' ? lineStroke(f) : lineStroke;
            if (t === 'Point' || t === 'MultiPoint')
                return typeof pointStroke === 'function' ? pointStroke(f) : pointStroke;
            return typeof polyStroke === 'function' ? polyStroke(f) : polyStroke;
        };
        const getLineWidth = (f) => {
            const t = f?.geometry?.type ?? '';
            if (t === 'LineString' || t === 'MultiLineString')
                return line.strokeWidth ?? 2;
            if (t === 'Point' || t === 'MultiPoint')
                return point.strokeWidth ?? 1.5;
            return poly.strokeWidth ?? 1;
        };
        const subLayerProps = {};
        if (polyStrokePattern !== 'solid') {
            subLayerProps['polygons-stroke'] = {
                extensions: [new PathStyleExtension({ dash: true })],
                getDashArray: DASH_ARRAYS[polyStrokePattern],
                dashJustified: true,
            };
        }
        if (lineStrokePattern !== 'solid') {
            subLayerProps['linestrings'] = {
                extensions: [new PathStyleExtension({ dash: true })],
                getDashArray: DASH_ARRAYS[lineStrokePattern],
                dashJustified: true,
            };
        }
        if (useFillPattern) {
            subLayerProps['polygons-fill'] = {
                extensions: [new FillStyleExtension({ pattern: true })],
                fillPatternAtlas: getFillPatternAtlas(),
                fillPatternMapping: FILL_PATTERN_MAPPING,
                getFillPattern: () => fillPattern,
                getFillPatternScale: 1,
                fillPatternMask: true,
                getFillPatternOffset: [0, 0],
            };
        }
        return new GeoJsonLayer({
            id: `deck-${config.layer_type}-${config.layer_id}`,
            data: loadRawVectorSource(config),
            pickable: true,
            stroked: true,
            filled: true,
            pointRadiusMinPixels: point.pointRadius ?? 6,
            getPointRadius: point.pointRadius ?? 6,
            getFillColor,
            getLineColor,
            getLineWidth,
            _subLayerProps: subLayerProps,
            onClick,
        });
    }
    async getInfo(_config, _coordinate) {
        return { type: 'none' };
    }
    supportsQueryFeatures() {
        return false;
    }
}
//# sourceMappingURL=raw-vector-adapter.js.map