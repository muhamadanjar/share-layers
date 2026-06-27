import { describe, it, expect } from 'vitest';
import { WMTSAdapter } from '../adapters/wmts-adapter';
import type { LayerConfig } from '../types';

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
