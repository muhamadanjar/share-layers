# Progress: Align shared layer types with Tileserver

Plan: [Align shared layer types with Tileserver](../plans/align-layer-types-with-tileserver.md)

## Investigation

- Reproduced `npm run build`; TypeScript stops at `src/adapters/wms-adapter.ts:7` because `params` is typed as `Record<string, string>` while `params.geoserver` is accessed as an object.
- Confirmed Tileserver `LayerResponse` uses `tile_url_template`, `id`, `is_visible`, and `file_metadata`; published GeoServer metadata contains `layer_name`, `store_name`, `workspace`, `wms_url`, `wfs_url`, and `bbox`.
- Confirmed dashboard maps the Tileserver response into normalized `LayerConfig`; its current mapper maps `id`/`tile_url_template`/`file_metadata` and defaults `visible` to `true` and `opacity` to `1`.

## Implementation

- Added `GeoServerMetadata` and Tileserver WMS metadata fields to `src/types.ts`.
- Updated the WMS adapter to consume typed nested GeoServer metadata, narrow DeckGL tile bounding boxes, and preserve per-tile sublayer props such as IDs and opacity.
- Added a regression test proving `file_metadata.geoserver.layer_name` is emitted as the WMS `LAYERS` parameter and tile sublayer props are inherited.
- Documented the Tileserver metadata contract in `src/README.md`.
## Validation

- `npx tsc --noEmit` passed.
- Focused WMS Vitest passed: 1 file, 4 tests.
- `npm run build` passed.
- `npm test -- --run` passed: 22 files, 84 tests.
- `graphify update .` rebuilt the layer graph successfully.
