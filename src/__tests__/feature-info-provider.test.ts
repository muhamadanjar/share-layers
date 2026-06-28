import { describe, it, expect } from 'vitest';
import { getFeatureInfo } from '../feature-info-provider';
import type { LayerConfig } from '../types';

describe('getFeatureInfo', () => {
  it('delegates to adapter for registered layer type', async () => {
    const config: LayerConfig = {
      layer_id: 'test-tile',
      layer_type: 'tile',
      filename: 'test.tif',
      file_type: 'raster',
      tile_url: 'http://example.com/tiles/{z}/{x}/{y}.png',
      visible: true,
      opacity: 0.8,
    };

    const result = await getFeatureInfo(config, [116, -1]);
    expect(result.type).toBe('none');
  });

  it('returns none for unknown layer type', async () => {
    const config: LayerConfig = {
      layer_id: 'test-unknown',
      layer_type: 'unknown' as any,
      filename: 'test.xyz',
      file_type: 'raster',
      tile_url: 'http://example.com/',
      visible: true,
      opacity: 0.8,
    };

    const result = await getFeatureInfo(config, [116, -1]);
    expect(result.type).toBe('none');
  });
});
