import { describe, it, expect } from 'vitest';
import { EsriAdapter } from '../adapters/esri-adapter';
import type { LayerConfig } from '../types';

describe('EsriAdapter', () => {
  const adapter = new EsriAdapter();

  it('creates layer for esri_mapserver type', () => {
    const config: LayerConfig = {
      layer_id: 'test-mapserver',
      layer_type: 'esri_mapserver',
      filename: 'mapserver.json',
      file_type: 'external',
      tile_url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
      visible: true,
      opacity: 0.85,
      file_metadata: {
        layers: '0,1,2',
        token: 'abc123',
      },
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeDefined();
    expect(layer.id).toBe('deck-esri-mapserver-test-mapserver');
    expect(layer.props.opacity).toBe(0.85);
  });

  it('creates layer for esri_tileserver type', () => {
    const config: LayerConfig = {
      layer_id: 'test-tileserver',
      layer_type: 'esri_tileserver',
      filename: 'tileserver.json',
      file_type: 'external',
      tile_url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer',
      visible: true,
      opacity: 0.9,
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeDefined();
    expect(layer.id).toBe('deck-esri-tileserver-test-tileserver');
    expect(layer.props.opacity).toBe(0.9);
  });

  it('creates layer for esri_imageserver type', () => {
    const config: LayerConfig = {
      layer_id: 'test-imageserver',
      layer_type: 'esri_imageserver',
      filename: 'imageserver.json',
      file_type: 'external',
      tile_url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/ImageServer',
      visible: true,
      opacity: 0.8,
      file_metadata: {
        token: 'xyz789',
      },
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeDefined();
    expect(layer.id).toBe('deck-esri-image-test-imageserver');
  });

  it('creates layer for esri_featureserver type', () => {
    const config: LayerConfig = {
      layer_id: 'test-featureserver',
      layer_type: 'esri_featureserver',
      filename: 'featureserver.json',
      file_type: 'external',
      tile_url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Features/FeatureServer',
      visible: true,
      opacity: 0.85,
      file_metadata: {
        layerIndex: '2',
        where: 'state=\'CA\'',
        token: 'def456',
      },
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeDefined();
    expect(layer.id).toBe('deck-esri-feature-test-featureserver');
    expect(layer.props.stroked).toBe(true);
    expect(layer.props.filled).toBe(true);
  });

  it('creates layer for esri_vectortileserver type', () => {
    const config: LayerConfig = {
      layer_id: 'test-vectortileserver',
      layer_type: 'esri_vectortileserver',
      filename: 'vectortileserver.json',
      file_type: 'external',
      tile_url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Vector/VectorTileServer',
      visible: true,
      opacity: 0.75,
      file_metadata: {
        token: 'vt123',
      },
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeDefined();
    expect(layer.id).toBe('deck-esri-mvt-test-vectortileserver');
    expect(layer.props.opacity).toBe(0.75);
    expect(layer.props.uniqueIdProperty).toBe('OBJECTID');
  });

  it('supports query features capability', () => {
    expect(adapter.supportsQueryFeatures()).toBe(true);
  });

  it('returns none for feature info', async () => {
    const config: LayerConfig = {
      layer_id: 'test-esri',
      layer_type: 'esri_mapserver',
      filename: 'test.json',
      file_type: 'external',
      tile_url: 'https://services.arcgisonline.com/arcgis/rest/services/Example/MapServer',
      visible: true,
      opacity: 0.85,
    };
    const info = await adapter.getInfo(config, [116, -1]);
    expect(info.type).toBe('none');
  });

  it('returns null for unknown layer type', () => {
    const config: LayerConfig = {
      layer_id: 'test-unknown',
      layer_type: 'tile' as any,
      filename: 'test.json',
      file_type: 'external',
      tile_url: 'https://example.com/tiles',
      visible: true,
      opacity: 0.85,
    };
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeNull();
  });
});
