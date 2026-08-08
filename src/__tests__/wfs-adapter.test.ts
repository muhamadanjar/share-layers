import { describe, it, expect } from 'vitest';
import { WFSAdapter } from '../adapters/wfs-adapter';
import type { LayerConfig } from '../types';

describe('WFSAdapter', () => {
  const adapter = new WFSAdapter();

  it('creates GeoJsonLayer for WFS type', () => {
    const config: LayerConfig = {
      layer_id: 'test-wfs',
      layer_type: 'wfs',
      filename: 'test.wfs',
      file_type: 'vector',
      tile_url: 'http://example.com/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=topp:states&outputFormat=application/json',
      visible: true,
      opacity: 0.85,
      file_metadata: {
        style: {
          Polygon: {
            fillColor: [74, 144, 226],
            opacity: 0.7,
          },
          LineString: {
            strokeColor: [255, 255, 255],
            strokeWidth: 1,
            opacity: 0.85,
          },
          Point: {
            fillColor: [74, 144, 226],
            pointRadius: 6,
            opacity: 0.9,
          },
        },
      },
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeDefined();
    expect(layer.id).toBe('deck-wfs-test-wfs');
  });

  it('returns none for feature info (no API call)', async () => {
    const config: LayerConfig = {
      layer_id: 'test-wfs',
      layer_type: 'wfs',
      filename: 'test.wfs',
      file_type: 'vector',
      tile_url: 'http://example.com/wfs',
      visible: true,
      opacity: 0.85,
    };
    const info = await adapter.getInfo(config, [116, -1]);
    expect(info.type).toBe('none');
  });

  it('does not support query features for WFS', () => {
    expect(adapter.supportsQueryFeatures()).toBe(false);
  });
});
