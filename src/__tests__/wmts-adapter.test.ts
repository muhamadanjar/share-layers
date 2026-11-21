import { describe, it, expect } from 'vitest';
import { WMTSAdapter, buildWmtsTileUrl, resolveTileMatrixLevel } from '../adapters/wmts-adapter';
import type { LayerConfig } from '../types';

const GWC_URL = 'http://localhost:8080/geoserver/gwc/service/wmts';

function paramsOf(url: string): URLSearchParams {
  return new URLSearchParams(url.slice(url.indexOf('?') + 1));
}

const ZOOM_0_RESOLUTION = 156543.03392804097;
/** 25 levels halving from zoom 0, the shape GeoWebCache's EPSG:900913 GridSet has. */
const FULL_PYRAMID = Array.from({ length: 25 }, (_unused, level) => ZOOM_0_RESOLUTION / 2 ** level);

describe('resolveTileMatrixLevel', () => {
  it('keeps zoom when no GridSet resolutions are known', () => {
    expect(resolveTileMatrixLevel(7)).toBe(7);
    expect(resolveTileMatrixLevel(7, [])).toBe(7);
  });

  it('maps zoom to the level whose resolution matches', () => {
    // Level 0 at 1:1 with zoom 0.
    expect(resolveTileMatrixLevel(7, FULL_PYRAMID)).toBe(7);
    // GridSet starting one level deeper, so its level 0 equals zoom 1.
    expect(resolveTileMatrixLevel(7, FULL_PYRAMID.slice(1))).toBe(6);
  });

  it('clamps to the GridSet level range', () => {
    expect(resolveTileMatrixLevel(0, FULL_PYRAMID.slice(0, 2))).toBe(0);
    expect(resolveTileMatrixLevel(18, FULL_PYRAMID.slice(0, 2))).toBe(1);
  });
});

describe('buildWmtsTileUrl', () => {
  it('uses the geowebcache grid set and a prefixed TileMatrix', () => {
    const url = buildWmtsTileUrl(
      GWC_URL,
      { layer: 'tileserver:layer-xyz', tilematrixset: 'EPSG:900913', format: 'image/png' },
      5,
      12,
      20,
    );
    const params = paramsOf(url);

    expect(url.startsWith(`${GWC_URL}?`)).toBe(true);
    expect(params.get('SERVICE')).toBe('WMTS');
    expect(params.get('REQUEST')).toBe('GetTile');
    expect(params.get('VERSION')).toBe('1.0.0');
    expect(params.get('LAYER')).toBe('tileserver:layer-xyz');
    expect(params.get('TILEMATRIXSET')).toBe('EPSG:900913');
    expect(params.get('TILEMATRIX')).toBe('EPSG:900913:5');
    expect(params.get('TILEROW')).toBe('20');
    expect(params.get('TILECOL')).toBe('12');
    expect(params.get('FORMAT')).toBe('image/png');
  });

  it('defaults a managed layer to EPSG:900913 instead of a grid set the server does not have', () => {
    const params = paramsOf(
      buildWmtsTileUrl(
        GWC_URL,
        { layer: 'tileserver:layer-xyz', geoserver: { layer_name: 'tileserver:layer-xyz' } },
        3,
        1,
        2,
      ),
    );

    expect(params.get('TILEMATRIXSET')).toBe('EPSG:900913');
    expect(params.get('TILEMATRIX')).toBe('EPSG:900913:3');
  });

  it('keeps the historical default for a third-party WMTS layer', () => {
    const params = paramsOf(buildWmtsTileUrl('https://wmts.example.test/wmts', { layer: 'topp:states' }, 3, 1, 2));

    expect(params.get('TILEMATRIXSET')).toBe('WebMercatorQuad');
    expect(params.get('TILEMATRIX')).toBe('WebMercatorQuad:3');
  });

  it('falls back to the geoserver layer name when no adapter key is stored', () => {
    const params = paramsOf(
      buildWmtsTileUrl(GWC_URL, { geoserver: { layer_name: 'tileserver:layer-abc' } }, 1, 0, 1),
    );

    expect(params.get('LAYER')).toBe('tileserver:layer-abc');
  });

  it('appends with & when the base url already carries a query', () => {
    const url = buildWmtsTileUrl(`${GWC_URL}?token=abc`, { layer: 'topp:states' }, 2, 1, 1);

    expect(url).toContain('?token=abc&SERVICE=WMTS');
    expect(paramsOf(`?${url.slice(url.indexOf('?') + 1)}`).get('token')).toBe('abc');
  });

  it('maps the deck.gl zoom through the GridSet resolutions', () => {
    const params = paramsOf(
      buildWmtsTileUrl(
        GWC_URL,
        { layer: 'topp:states', tilematrixset_resolutions: FULL_PYRAMID.slice(1) },
        4,
        3,
        5,
      ),
    );

    expect(params.get('TILEMATRIX')).toBe('WebMercatorQuad:3');
    expect(params.get('TILECOL')).toBe('3');
    expect(params.get('TILEROW')).toBe('5');
  });
});

describe('WMTSAdapter', () => {
  const adapter = new WMTSAdapter();

  it('creates TileLayer for WMTS type', () => {
    const config: LayerConfig = {
      layer_id: 'test-wmts',
      layer_type: 'wmts',
      filename: 'test.wmts',
      file_type: 'raster',
      tile_url: 'http://example.com/wmts',
      visible: true,
      opacity: 0.85,
      file_metadata: {
        layer: 'GoogleMapsCompatible_Level8',
        tilematrixset: 'GoogleMapsCompatible_Level8',
        format: 'image/jpeg',
      },
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeDefined();
    expect(layer.id).toBe('deck-wmts-test-wmts');
  });

  it('returns none for feature info (raster)', async () => {
    const config: LayerConfig = {
      layer_id: 'test-wmts',
      layer_type: 'wmts',
      filename: 'test.wmts',
      file_type: 'raster',
      tile_url: 'http://example.com/wmts',
      visible: true,
      opacity: 0.85,
    };
    const info = await adapter.getInfo(config, [116, -1]);
    expect(info.type).toBe('none');
  });

  it('does not support query features for WMTS', () => {
    expect(adapter.supportsQueryFeatures()).toBe(false);
  });
});
