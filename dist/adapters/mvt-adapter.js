import { MVTLayer } from '@deck.gl/geo-layers';
import { GeoJsonLayer } from '@deck.gl/layers';
import { PathStyleExtension, FillStyleExtension } from '@deck.gl/extensions';
import { resolveStyle, toRGBA, makeFillColorAccessor, DASH_ARRAYS, FILL_PATTERN_MAPPING, getFillPatternAtlas, } from '../style-helpers';
export class MVTAdapter {
    createDeckLayer(config, onClick) {
        const style = config.file_metadata?.style;
        const poly = resolveStyle(style, 'Polygon');
        const line = resolveStyle(style, 'LineString');
        const point = resolveStyle(style, 'Point');
        const lineStrokePattern = (line.strokePattern ?? 'solid');
        const polyStrokePattern = (poly.strokePattern ?? 'solid');
        const fillPattern = (poly.fillPattern ?? 'solid');
        const useFillPattern = fillPattern !== 'solid';
        const alpha = Math.round((poly.opacity ?? 0.7) * 255);
        const fillColorAccessor = makeFillColorAccessor(poly, alpha);
        const polyLineColor = toRGBA(poly.strokeColor, poly.opacity);
        const lineLineColor = toRGBA(line.strokeColor, line.opacity);
        const pointLineColor = toRGBA(point.strokeColor, point.opacity);
        return new MVTLayer({
            id: `deck-mvt-${config.layer_id}`,
            data: config.tile_url,
            pickable: true,
            filled: true,
            stroked: true,
            pointRadiusScale: point.pointRadius,
            getFillColor: fillColorAccessor,
            getLineColor: (f) => {
                const geomType = f?.geometry?.type ?? '';
                if (geomType === 'LineString' || geomType === 'MultiLineString')
                    return lineLineColor;
                if (geomType === 'Point' || geomType === 'MultiPoint')
                    return pointLineColor;
                return polyLineColor;
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