# Tileserver-aligned layer metadata types

Plan: [Align shared layer types with Tileserver](../plans/align-layer-types-with-tileserver.md)  
Progress: [Align shared layer types with Tileserver](../progress/align-layer-types-with-tileserver.md)

## Contract

The Tileserver API returns layer records with backend names such as `id` and `tile_url_template`. Dashboard code maps those records into the normalized shared `LayerConfig` shape before passing them to adapters:

- `id` → `layer_id`
- `tile_url_template` → `tile_url`
- `file_metadata` → `file_metadata`
- `is_visible` is currently normalized to `visible: true`
- backend `opacity` is currently normalized to `opacity: 1`

The normalized defaults are the current dashboard behavior; the shared package does not change that mapper.

A published GeoServer WMS layer stores service metadata under `file_metadata.geoserver`:

```typescript
interface GeoServerMetadata {
  layer_name: string;
  store_name?: string;
  workspace?: string;
  wms_url?: string;
  wfs_url?: string;
  bbox?: [number, number, number, number] | null;
  style_name?: string;
}
```

The WMS adapter uses `file_metadata.layers` first for compatibility with direct/external WMS configuration, then falls back to `file_metadata.geoserver.layer_name`, matching the Tileserver publish response.

## Usage

```typescript
const layer: LayerConfig = {
  layer_id: 'published-wms',
  layer_type: 'wms',
  filename: 'states.wms',
  file_type: 'external',
  tile_url: 'https://maps.example/geoserver/tileserver/wms',
  visible: true,
  opacity: 1,
  file_metadata: {
    geoserver: {
      layer_name: 'tileserver:states',
      wms_url: 'https://maps.example/geoserver/tileserver/wms',
      wfs_url: 'https://maps.example/geoserver/tileserver/wfs',
    },
  },
};
```

The adapter emits a WMS GetMap request with `LAYERS=tileserver%3Astates` and the tile bounding box.
