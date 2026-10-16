# Align shared layer types with Tileserver

## Problem

The shared WMS adapter treats `file_metadata` as a flat `Record<string, string>`, but Tileserver stores published GeoServer metadata under `file_metadata.geoserver`. The nested `layer_name` value is therefore inferred as a string and the release build fails with TS2339.

## Scope

- Model the Tileserver GeoServer metadata shape in the shared layer types.
- Use the typed metadata in the WMS adapter without weakening the type with `any` or an incorrect flat string record.
- Preserve the normalized `LayerConfig` shape consumed by dashboard and geoportal adapters.
- Add regression coverage for a Tileserver-style published WMS layer.
- Keep generated `dist/` output current through the package build.

## Acceptance criteria

- `npm run build` completes without TypeScript errors.
- A WMS config with `file_metadata.geoserver.layer_name` produces a GetMap URL containing that layer name.
- Existing layer adapter tests continue to pass.
- Shared types document the backend fields used by Tileserver responses and metadata.
