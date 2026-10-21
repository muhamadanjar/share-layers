# DeckGL Mapbox adapter export

## Goal
Make `@muhamadanjar/layers` the single application dependency for the shared layer engine and its DeckGL Mapbox adapter.

## Scope
- Add `@deck.gl/mapbox` and its required DeckGL core/mesh runtime peers to the library runtime dependencies.
- Keep all DeckGL packages on the compatible 9.3.x line to prevent a 9.4.x peer mismatch.
- Export `MapboxOverlay` from the package root.
- Keep existing exports and adapter behavior unchanged.
- Regenerate `dist/` through the existing TypeScript build.

## Contract
Consumers may import `MapboxOverlay` from `@muhamadanjar/layers` alongside `layerFactory` and styling utilities. DeckGL package ownership moves to this library; application consumers can remove direct DeckGL dependencies after upgrading to the resulting library commit.

## Acceptance
- `package.json` and lockfile resolve a compatible `@deck.gl/mapbox` version.
- `src/index.ts` exports `MapboxOverlay`.
- Build emits the matching JavaScript and declaration output.
- Existing tests pass.
- No unrelated API or source changes.
