import { describe, it, expect } from 'vitest';
import { GeoJsonAdapter } from '../adapters/geojson-adapter';
import type { LayerConfig } from '../types';

describe('GeoJsonAdapter', () => {
  const adapter = new GeoJsonAdapter();

  it('creates GeoJsonLayer for geojson type', () => {
    const config: LayerConfig = {
      layer_id: 'test-geojson',
      layer_type: 'geojson',
      filename: 'test.geojson',
      file_type: 'vector',
      tile_url: 'http://example.com/test.geojson',
      visible: true,
      opacity: 0.85,
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeDefined();
  });

  it('returns none for feature info (no API call)', async () => {
    const config: LayerConfig = {
      layer_id: 'test-geojson',
      layer_type: 'geojson',
      filename: 'test.geojson',
      file_type: 'vector',
      tile_url: 'http://example.com/test.geojson',
      visible: true,
      opacity: 0.85,
    };
    const info = await adapter.getInfo(config, [116, -1]);
    expect(info.type).toBe('none');
  });

  it('does not support query features', () => {
    expect(adapter.supportsQueryFeatures()).toBe(false);
  });
});
