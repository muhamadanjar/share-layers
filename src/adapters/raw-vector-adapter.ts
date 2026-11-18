import { GeoJsonLayer } from '@deck.gl/layers';
import { PathStyleExtension, FillStyleExtension } from '@deck.gl/extensions';
import type { LayerAdapter } from './types';
import type { FeatureInfoResult, LayerConfig } from '../types';
import { loadRawVectorSource } from '../raw-vector-source';
import {
  resolveStyle,
  makeFillColorAccessor,
  makeStrokeColorAccessor,
  DASH_ARRAYS,
  FILL_PATTERN_MAPPING,
  getFillPatternAtlas,
} from '../style-helpers';
import type { StrokePattern, FillPattern } from '../types';

/** Renders browser-loaded SHP ZIP and GeoPackage feature data through GeoJsonLayer. */
export class RawVectorAdapter implements LayerAdapter {
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any {
    const style = config.file_metadata?.style;
    const poly = resolveStyle(style, 'Polygon');
    const line = resolveStyle(style, 'LineString');
    const point = resolveStyle(style, 'Point');
    const layerOpacity = config.opacity ?? 1;

    const polyStrokePattern = (poly.strokePattern ?? 'solid') as StrokePattern;
    const lineStrokePattern = (line.strokePattern ?? 'solid') as StrokePattern;
    const fillPattern = (poly.fillPattern ?? 'solid') as FillPattern;
    const useFillPattern = fillPattern !== 'solid';

    const polyFill = makeFillColorAccessor(poly, Math.round((poly.opacity ?? 0.7) * layerOpacity * 255));
    const pointFill = makeFillColorAccessor(point, Math.round((point.opacity ?? 0.9) * layerOpacity * 255));
    const polyStroke = makeStrokeColorAccessor(poly, Math.round((poly.opacity ?? 1) * layerOpacity * 255));
    const lineStroke = makeStrokeColorAccessor(line, Math.round((line.opacity ?? 1) * layerOpacity * 255));
    const pointStroke = makeStrokeColorAccessor(point, Math.round((point.opacity ?? 1) * layerOpacity * 255));


    const getFillColor = (f: any) => {
      const t = f?.geometry?.type ?? '';
      const acc = t === 'Point' || t === 'MultiPoint' ? pointFill : polyFill;
      return typeof acc === 'function' ? acc(f) : acc;
    };
    const getLineColor = (f: any) => {
      const t = f?.geometry?.type ?? '';
      if (t === 'LineString' || t === 'MultiLineString') return typeof lineStroke === 'function' ? lineStroke(f) : lineStroke;
      if (t === 'Point' || t === 'MultiPoint') return typeof pointStroke === 'function' ? pointStroke(f) : pointStroke;
      return typeof polyStroke === 'function' ? polyStroke(f) : polyStroke;
    };
    const getLineWidth = (f: any) => {
      const t = f?.geometry?.type ?? '';
      if (t === 'LineString' || t === 'MultiLineString') return line.strokeWidth ?? 2;
      if (t === 'Point' || t === 'MultiPoint') return point.strokeWidth ?? 1.5;
      return poly.strokeWidth ?? 1;
    };

    const subLayerProps: Record<string, any> = {};
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
    } as any);
  }

  async getInfo(_config: LayerConfig, _coordinate: [number, number]): Promise<FeatureInfoResult> {
    return { type: 'none' };
  }

  supportsQueryFeatures(): boolean {
    return false;
  }
}
