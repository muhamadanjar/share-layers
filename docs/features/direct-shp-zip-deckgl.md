# Direct SHP ZIP loading with DeckGL

Plan: [Direct SHP ZIP loading with DeckGL](../plans/direct-shp-zip-deckgl.md)  
Progress: [Direct SHP ZIP loading with DeckGL](../progress/direct-shp-zip-deckgl.md)

## Behavior

The `shp` layer accepts a URL to a ZIP archive containing a Shapefile sidecar set:

- `<layer>.shp` — geometry records
- `<layer>.dbf` — feature attributes
- `<layer>.prj` — CRS definition
- `<layer>.cpg` — optional DBF encoding label

The archive is fetched and parsed in a Web Worker. The resulting GeoJSON FeatureCollection is passed to the shared styled DeckGL `GeoJsonLayer`; the main thread does not parse the archive. `source_layer` is required when one archive contains multiple `.shp` members.

Supported geometry families are Point, MultiPoint, PolyLine, and Polygon, including Z/M variants and multipart records. DBF string, numeric, logical, and date/text values are preserved as feature properties; `.cpg` labels for UTF-8, Windows-1252/CP1252, and ISO-8859-1/Latin-1 are supported. EPSG:4326 is kept unchanged; EPSG:3857 is converted to WGS84. Other or missing CRS definitions are rejected.

## Configuration

```typescript
const parcels: LayerConfig = {
  layer_id: 'parcels',
  layer_type: 'shp',
  filename: 'parcels.zip',
  file_type: 'vector',
  tile_url: 'https://data.example/parcels.zip',
  visible: true,
  opacity: 1,
  source_options: {
    max_source_bytes: 50 * 1024 * 1024,
    max_features: 200_000,
    request_init: { credentials: 'include' },
  },
  onSourceStatus: (status) => {
    if (status.state === 'error') console.error(status.error);
  },
};
```

The defaults are 50 MiB per downloaded archive, 200,000 features, and a 100 MiB per-tab LRU cache. `onSourceStatus` reports `loading`, `ready`, or `error` while DeckGL resolves the asynchronous layer data.

## Large data guidance

DeckGL renders the parsed result through its normal layer lifecycle and the parser runs off the UI thread. The browser still holds the parsed FeatureCollection, so very large sources should be converted on the backend to tiled MVT or served through WFS/GeoJSON pagination instead of increasing limits without testing memory use.
