# Vector Symbology — Shared Renderers

| Field | Timestamp (UTC) |
|---|---|
| Created | `2026-11-17T19:40:44Z` |
| Last updated | `2026-11-17T23:49:53Z` |

Related Plan: [Vector and raster symbology plan](../plans/vector-raster-symbology.md)  
Related Progress: [Vector and raster symbology progress](../progress/vector-raster-symbology.md)

## Purpose

The shared layer types and MVT adapter provide field-based unique and numeric-range colors while preserving existing saved style JSON and geometry-specific pattern behavior.

## How It Works

- `CategoricalStyle` retains legacy `field`, `colorMap`, and `defaultColor` and adds optional explicit classes, ranges, and separate stroke colors.
- Fill and stroke accessors evaluate feature properties independently. Null/empty values may use an explicit NoData class; unknown values use the configured fallback. Numeric ranges include the lower bound and exclude the upper bound except for the final range.
- Point, LineString, and Polygon keep geometry-specific fill/stroke accessors in both MVT and raw-vector adapters. Polygon fill patterns do not alter outlines; line dash patterns affect strokes only; Point markers remain unhatched with independent fills/outlines. Point radius comes from the configured per-geometry style.
- Explicit class and range arrays are limited to 100 entries. Numeric feature properties match equivalent string category keys; existing consumers without the new optional fields retain legacy behavior.

## Usage and Integration

Consumers continue to pass the existing per-geometry style state to the MVT or raw-vector adapter. No new adapter API or dependency is required. Dashboard currently uses local MVT accessors until it consumes a compatible published revision; the shared raw-vector fixes are not active in its pinned package.

## Verification

The package suite passed: 113 tests, including raw-vector and MVT accessor behavior. `pnpm run build` completed successfully.