import { MVTLayer } from '@deck.gl/geo-layers';
import { GeoJsonLayer } from '@deck.gl/layers';
import { PathStyleExtension, FillStyleExtension } from '@deck.gl/extensions';
import { resolveStyle, makeFillColorAccessor, makeStrokeColorAccessor, DASH_ARRAYS, FILL_PATTERN_MAPPING, getFillPatternAtlas, } from '../style-helpers';
export class MVTAdapter {
    createDeckLayer(config, onClick) {
        const style = config.file_metadata?.style;
        const poly = resolveStyle(style, 'Polygon');
        const line = resolveStyle(style, 'LineString');
        const point = resolveStyle(style, 'Point');
        const layerOpacity = config.opacity ?? 1;
        const lineStrokePattern = (line.strokePattern ?? 'solid');
        const polyStrokePattern = (poly.strokePattern ?? 'solid');
        const fillPattern = (poly.fillPattern ?? 'solid');
        const useFillPattern = fillPattern !== 'solid';
        const fillColorAccessor = makeFillColorAccessor(poly, Math.round((poly.opacity ?? 0.7) * layerOpacity * 255));
        const pointFillColorAccessor = makeFillColorAccessor(point, Math.round((point.opacity ?? 0.9) * layerOpacity * 255));
        const polyStrokeAccessor = makeStrokeColorAccessor(poly, Math.round((poly.opacity ?? 1) * layerOpacity * 255));
        const lineStrokeAccessor = makeStrokeColorAccessor(line, Math.round((line.opacity ?? 1) * layerOpacity * 255));
        const pointStrokeAccessor = makeStrokeColorAccessor(point, Math.round((point.opacity ?? 1) * layerOpacity * 255));
        return new MVTLayer({
            id: `deck-mvt-${config.layer_id}`,
            data: config.tile_url,
            pickable: true,
            filled: true,
            stroked: true,
            pointRadiusMinPixels: point.pointRadius ?? 6,
            getPointRadius: point.pointRadius ?? 6,
            getFillColor: (f) => {
                const geometryType = f?.geometry?.type ?? '';
                const accessor = geometryType === 'Point' || geometryType === 'MultiPoint'
                    ? pointFillColorAccessor
                    : fillColorAccessor;
                return typeof accessor === 'function' ? accessor(f) : accessor;
            },
            getLineColor: (f) => {
                const geomType = f?.geometry?.type ?? '';
                if (geomType === 'LineString' || geomType === 'MultiLineString')
                    return typeof lineStrokeAccessor === 'function' ? lineStrokeAccessor(f) : lineStrokeAccessor;
                if (geomType === 'Point' || geomType === 'MultiPoint')
                    return typeof pointStrokeAccessor === 'function' ? pointStrokeAccessor(f) : pointStrokeAccessor;
                return typeof polyStrokeAccessor === 'function' ? polyStrokeAccessor(f) : polyStrokeAccessor;
            },
            getLineWidth: (f) => {
                const geomType = f?.geometry?.type ?? '';
                if (geomType === 'LineString' || geomType === 'MultiLineString')
                    return line.strokeWidth ?? 2;
                if (geomType === 'Point' || geomType === 'MultiPoint')
                    return point.strokeWidth ?? 1.5;
                return poly.strokeWidth ?? 1;
            },
            autoHighlight: true,
            highlightColor: [255, 0, 0, 255],
            renderSubLayers: (props) => {
                const parentExtensions = props.extensions ?? [];
                const subLayerProps = {};
                if (polyStrokePattern !== 'solid') {
                    subLayerProps['polygons-stroke'] = {
                        extensions: [...parentExtensions, new PathStyleExtension({ dash: true })],
                        getDashArray: DASH_ARRAYS[polyStrokePattern],
                        dashJustified: true,
                    };
                }
                if (lineStrokePattern !== 'solid') {
                    subLayerProps['linestrings'] = {
                        extensions: [...parentExtensions, new PathStyleExtension({ dash: true })],
                        getDashArray: DASH_ARRAYS[lineStrokePattern],
                        dashJustified: true,
                    };
                }
                if (useFillPattern) {
                    subLayerProps['polygons-fill'] = {
                        extensions: [...parentExtensions, new FillStyleExtension({ pattern: true })],
                        fillPatternAtlas: getFillPatternAtlas(),
                        fillPatternMapping: FILL_PATTERN_MAPPING,
                        getFillPattern: () => fillPattern,
                        getFillPatternScale: 1,
                        fillPatternMask: true,
                        getFillPatternOffset: [0, 0],
                    };
                }
                return new GeoJsonLayer({
                    ...props,
                    _subLayerProps: subLayerProps,
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
//# sourceMappingURL=mvt-adapter.js.map