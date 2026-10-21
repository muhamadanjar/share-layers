# DeckGL Mapbox adapter export

Plan: [DeckGL Mapbox adapter export](../plans/deckgl-mapbox-export.md)  
Progress: [DeckGL Mapbox adapter export](../progress/deckgl-mapbox-export.md)

## Public API

`@muhamadanjar/layers` now owns the runtime DeckGL Mapbox dependency and exports `MapboxOverlay` from the package root:

```ts
import {
  MapboxOverlay,
  layerFactory,
  STYLE_DEFAULTS,
} from '@muhamadanjar/layers'

const overlay = new MapboxOverlay({
  interleaved: true,
  layers: [],
})

map.addControl(overlay)
```

Existing layer-factory, metadata, type, style, and utility exports are unchanged.

## Consumer migration

After upgrading to a library commit containing this feature, consumers can remove direct DeckGL package dependencies and replace:

```ts
import { MapboxOverlay } from '@deck.gl/mapbox'
```

with:

```ts
import { MapboxOverlay } from '@muhamadanjar/layers'
```

The generated `dist/index.js` and `dist/index.d.ts` are part of the published package output.
