import { describe, it, expect, beforeEach } from 'vitest';
import { LayerFactory } from '../layer-factory';
import type { LayerAdapter } from '../adapters/types';
import type { LayerConfig } from '../types';

describe('LayerFactory', () => {
  let factory: LayerFactory;

  beforeEach(() => {
    factory = new LayerFactory();
  });

  it('registers tile adapter on init', () => {
    const adapter = factory.getAdapter('tile');
    expect(adapter).toBeDefined();
  });

  it('getAdapter returns undefined for unregistered type', () => {
    const adapter = factory.getAdapter('unknown' as any);
    expect(adapter).toBeUndefined();
  });

  it('createLayer returns null for unknown type', () => {
    const config: LayerConfig = {
      layer_id: 'test',
      layer_type: 'unknown' as any,
      filename: 'test.tif',
      file_type: 'raster',
      tile_url: 'http://example.com',
      visible: true,
      opacity: 1,
    };
    const layer = factory.createLayer(config);
    expect(layer).toBeNull();
  });
});
