# Vector and Raster Symbology — Shared Renderer

Related Progress: [Shared renderer progress](../progress/vector-raster-symbology.md)  
Related Design Doc: [Approved design](../../../../services/dashboard/docs/design-docs/2026-11-17-symbology-vector-raster.md)  
Cross-component Plan: [Dashboard integration plan](../../../../services/dashboard/docs/plans/vector-raster-symbology.md)

## Goal

Make the shared MVT and raw-vector adapters render field categories with independent fill/stroke colors while retaining geometry-specific patterns and compatibility with saved styles used by Dashboard and other consumers.

## Scope and Decisions

- Modify only the shared style model/accessors and existing MVT/raw-vector adapters; no new dependency or adapter API.
- Preserve existing `CategoricalStyle.field`, `colorMap`, and `defaultColor` behavior for old local style JSON.
- Extend categorical data for numeric equal-interval ranges and separate stroke colors, with a maximum of 100 classes/ranges per style. `strokeColorMode` independently selects solid or categorical strokes; absent mode retains the legacy `colorMode` fallback. `null`/empty values have an explicit NoData class; unseen values use fallback. Apply fill patterns only to Polygon fill; stroke patterns to LineString and Polygon outline; Point fill stays solid with independent outline.
- Keep per-geometry configuration and `LayerConfig.file_metadata.style` as the source of truth; match numeric feature values against equivalent string class values.

## Implementation

1. Update `src/types.ts` with additive category classes/ranges/stroke fields and exported `RasterStyle` plus optional `LayerStyle.raster`, while retaining the legacy unique-value fields.
2. Update `src/style-helpers.ts` to resolve unique/range fill and stroke accessors, including null and unknown values, without changing solid-style defaults; explicit `strokeColorMode: "solid"` must suppress stale categorical stroke data.
3. Update `src/adapters/mvt-adapter.ts` and `src/adapters/raw-vector-adapter.ts` so geometry-specific feature accessors use category colors for Point, LineString, and Polygon fills/outlines; preserve fill/dash patterns and configured point radius.
4. Extend adapter/accessor tests to exercise actual feature properties, geometry dispatch, point radius, and pattern settings.
5. Update `docs/README.md` and the package README after the final style contract is implemented.

### Required behavior test cases

- `test_make_fill_color_accessor_uses_unique_category_and_legacy_fallback`: evaluate actual feature properties and prove old `colorMap/defaultColor` behavior remains.
- `test_category_accessor_distinguishes_nodata_class_from_unknown_fallback`: verify `null`/empty match the explicit NoData class and unseen values return fallback.
- `test_mvt_adapter_uses_category_fill_and_stroke_per_geometry`: call MVT/raw-vector adapter `getFillColor`/`getLineColor` accessors with Point, LineString, and Polygon features and assert independent colors.
- `test_mvt_adapter_keeps_fill_and_stroke_patterns_geometry_scoped`: verify polygon fill patterns do not alter polygon/line stroke patterns and point stays unhatched.

## Acceptance Criteria

- Legacy color maps still return the same RGBA colors and fallback as before.
- Unique and numeric range categories return the selected class fill and stroke for actual feature properties; null/empty match an explicit NoData class and unseen values return fallback.
- Explicit solid stroke mode ignores stored categorical stroke classes.
- Polygon fill and outline colors can differ; line category color affects stroke only; Point category color affects marker fill and outline independently in MVT and raw-vector adapters.
- Existing polygon fill and line/outline dash patterns remain attached to their intended geometry; point markers remain unhatched, and configured point radius reaches both adapters.
- Package tests and build pass; categorized styles over 100 entries fail at accessor construction, and downstream type consumers remain compatible with existing style JSON.

## Verification

- Run the focused Vitest tests, `pnpm run test -- --run`, and `pnpm run build` from `libs/layers`.
- Verify tests invoke `getFillColor`/`getLineColor` accessors using feature objects rather than only asserting adapter construction.
- Run `graphify update .` if a graph exists for this package.

## Risks

- `@muhamadanjar/layers` is consumed outside Dashboard; optional additive fields and legacy fallback are required to avoid breaking consumers.
- Deck.gl may evaluate accessors for different geometry property shapes; cover Point/MultiPoint, LineString/MultiLineString, and Polygon/MultiPolygon feature types.
- Dashboard currently pins an older Git revision of `@muhamadanjar/layers`; its local MVT accessors cover this feature until a compatible shared package revision is released and consumed.
