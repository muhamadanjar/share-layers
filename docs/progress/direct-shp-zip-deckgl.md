# Progress: Direct SHP ZIP loading with DeckGL

Plan: [Direct SHP ZIP loading with DeckGL](../plans/direct-shp-zip-deckgl.md)

## Status

- [x] Plan and progress initialized before code changes.
- [x] Replace `shpjs` with the internal ZIP/SHP/DBF parser.
- [x] Remove `shpjs` dependencies and update package manifests/lockfile.
- [x] Add focused parser regression coverage.
- [x] Run focused and full tests, build, and DeckGL layer smoke verification.

## Implementation notes

- Added `src/shapefile-parser.ts`, an internal `fflate`-based ZIP reader and SHP/DBF parser.
- The parser supports Point, MultiPoint, PolyLine, and Polygon shape families, including Z/M records, DBF properties, multipart geometries, EPSG:4326, and EPSG:3857-to-WGS84 conversion.
- `raw-vector-worker.ts` now delegates SHP ZIP parsing to the internal parser; GeoPackage loading and worker request/status behavior remain unchanged.
- Added deterministic parser seam coverage for properties, multipart geometries, CRS conversion, sidecar validation, and feature limits.
- Focused parser tests pass: 8 tests.
- Full package tests pass: 24 files and 99 tests.
- `npm run build` passes and regenerates `dist/`.
- A source-level smoke check creates `deck-shp-parcels` as a `GeoJsonLayer` through `LayerFactory`.

