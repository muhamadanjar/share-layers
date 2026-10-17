# Direct SHP ZIP loading with DeckGL

## Problem

The `shp` layer currently depends on `shpjs` inside a Web Worker. The package should remove that dependency while retaining direct browser loading of ZIP Shapefiles and rendering through the existing DeckGL adapter path.

## Scope

- Replace the `shpjs` parser with an internal Web Worker parser for the common ESRI Shapefile geometry and DBF attribute records carried in a ZIP archive.
- Preserve the existing `LayerConfig` contract, source limits, cache, status callbacks, CRS checks, and GeoPackage support.
- Keep rendering behind `GeoJsonLayer`, so callers still receive the existing DeckGL layer interface and large-source work stays off the main thread.
- Remove `shpjs` and `@types/shpjs` from package manifests and lockfile.
- Add regression coverage for direct SHP ZIP parsing and update package documentation.

## Design

1. The source worker fetches the ZIP, enforces byte limits, extracts the selected `.shp`, `.dbf`, and `.prj` members with `fflate`, and parses records into a GeoJSON `FeatureCollection`.
2. The parser joins DBF rows to SHP records by record order, supports the standard point, multipoint, polyline, and polygon families, and converts EPSG:3857 coordinates to WGS84. EPSG:4326 remains unchanged; unsupported or missing `.prj` files fail with an actionable error.
3. `RawVectorAdapter` continues to pass the worker promise to the existing styled `GeoJsonLayer`; no caller-facing adapter API changes are introduced.
4. Existing max-feature, request, cache, and status behavior remains unchanged.

## Acceptance criteria

- No source or package manifest references `shpjs`.
- A valid zipped SHP source can be parsed in the worker path into GeoJSON with properties and geometry.
- Point, line, polygon, multipoint, and multipart polygon records preserve their GeoJSON shape.
- EPSG:3857 input is converted to WGS84; unsupported CRS is rejected.
- Existing GeoPackage and adapter behavior remains intact.
- Focused tests, the full package test suite, and `npm run build` pass.
- Generated `dist/` output is current and docs link the plan and progress records.
