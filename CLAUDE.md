# CLAUDE.md

Guidance for working with the @muhumadanjar/layers shared geospatial layer engine.

## Project Overview

`@muhumadanjar/layers` is a unified adapter engine for rendering 15+ geospatial layer types across dashboard and geoportal services. Implements the **Adapter Pattern** to avoid massive if/else trees for different layer rendering logic (tile, vector, MVT, WMS, WFS, Esri, WMTS, etc.).

**Key exports:**
- `layerFactory` — Create DeckGL layers + query feature info
- `renderFeatureProperties` — Template-based feature metadata rendering (3 modes)
- `LayerConfig`, `LayerType`, `LayerAdapter` — Type definitions
- Adapters — TileAdapter, MVTAdapter, WMSAdapter, WFSAdapter, EsriAdapter, GeoJsonAdapter, WMTSAdapter

## Development Workflow

### Setup (Monorepo Mode)

During feature branch development:

```bash
# At root: base-project-apps/
pnpm install
pnpm --filter @muhumadanjar/layers build

# Build output
libs/layers/dist/
├── index.js (exports all adapters & factory)
├── layer-factory.js
├── types.js
├── *.d.ts (type declarations)
└── *.map (source maps)
```

### Package Configuration

**Name:** `@muhumadanjar/layers`  
**Package type:** ESM (`"type": "module"`)  
**Main entry:** `./dist/index.js`  
**Build script:** `tsc` (TypeScript → dist/)  
**Test:** `vitest`

**Exports (for consumers):**
```json
{
  ".": "./dist/index.js",
  "./layer-factory": "./dist/layer-factory.js",
  "./feature-info-provider": "./dist/feature-info-provider.js",
  "./metadata-renderer": "./dist/metadata-renderer.js",
  "./types": "./dist/types.js",
  "./utils": "./dist/utils.js",
  "./style-helpers": "./dist/style-helpers.js"
}
```

### Development Commands

```bash
# From libs/layers/
pnpm run build              # Compile TypeScript → dist/
pnpm run test               # Run vitest

# From root (monorepo)
pnpm --filter @muhumadanjar/layers build
pnpm --filter @muhumadanjar/layers test
```

## Using in Services

### Dashboard (Monorepo Workspace)

```json
{
  "dependencies": {
    "@muhumadanjar/layers": "workspace:*"
  }
}
```

Imports resolve to local `services/shared/dist/` via pnpm symlink.

```typescript
import { layerFactory } from '@muhumadanjar/layers/layer-factory'
import { getFeatureInfo } from '@muhumadanjar/layers/feature-info-provider'
import type { LayerConfig } from '@muhumadanjar/layers'
```

### Geoportal (Git Submodule)

```json
{
  "dependencies": {
    "@muhumadanjar/layers": "git+https://github.com/muhumadanjar/share-layers.git"
  }
}
```

Imports fetch from remote git repo on `pnpm install`.

## Production Deployment

### Pre-Merge Checklist

Before merging to `main` or `master`:

- [ ] `pnpm run build` succeeds
- [ ] `dist/` folder contains 100+ .js + .d.ts files
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] All consumers (dashboard, geoportal) use correct import: `@muhumadanjar/layers`

### Post-Merge (CI/CD)

1. **Publish to registry** (npm or private repo)
   ```bash
   npm publish
   # or manual: services/shared/dist/ → registry
   ```

2. **Geoportal & Dashboard** auto-fetch latest via CI/CD
   ```bash
   pnpm install @muhumadanjar/layers@latest
   ```

## Architecture

### Adapter Pattern

Each layer type (tile, MVT, WMS, etc.) implements `LayerAdapter`:

```typescript
interface LayerAdapter {
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): Layer | null
  getInfo(config: LayerConfig, coordinate: [lng, lat]): Promise<FeatureInfoResult>
  supportsQueryFeatures(): boolean
}
```

**Adapters in `/lib/layers/adapters/`:**
- `tile-adapter.ts` — Raster tiles, vector tiles, mbtiles
- `mvt-adapter.ts` — Mapbox vector tiles (MVT)
- `wms-adapter.ts` — WMS GetMap + GetFeatureInfo
- `wmts-adapter.ts` — WMTS GetTile requests
- `wfs-adapter.ts` — WFS GetFeature requests
- `geojson-adapter.ts` — Direct GeoJSON + KML conversion
- `esri-adapter.ts` — All Esri services (MapServer, FeatureServer, etc.)

### Factory Pattern

`LayerFactory` auto-registers all adapters and provides a unified interface:

```typescript
// Single method for all layer types
const layer = layerFactory.createLayer(config, handleMapClick)

// Polymorphic feature info
const info = await layerFactory.getAdapter(type).getInfo(config, coordinate)
// Returns: { type: 'vector', count, features } | { type: 'raster', count, values } | { type: 'none' }
```

### Metadata Rendering

`renderFeatureProperties()` supports 3 display modes from file metadata:

1. **original** — All properties as-is
2. **fields** — Select visible properties with custom labels
3. **custom** — Template string with `{{ field }}` substitution

```typescript
import { renderFeatureProperties } from '@muhumadanjar/layers/metadata-renderer'

renderFeatureProperties(feature, {
  renderMode: 'fields',
  fields: [
    { original: 'name', label: 'Place Name', visible: true },
    { original: 'population', label: 'Population', visible: true },
  ],
})
```

## File Structure

```
libs/layers/                         # Shared utilities package
├── lib/layers/
│   ├── index.ts                    # Main exports
│   ├── types.ts                    # LayerConfig, LayerType, LayerAdapter
│   ├── layer-factory.ts            # Factory + adapter registration
│   ├── feature-info-provider.ts    # Feature extraction interface
│   ├── metadata-renderer.ts        # Template rendering (3 modes)
│   ├── utils.ts                    # Helper functions
│   ├── style-helpers.ts            # Deck.gl styling utilities
│   ├── adapters/
│   │   ├── tile-adapter.ts
│   │   ├── mvt-adapter.ts
│   │   ├── wms-adapter.ts
│   │   ├── wmts-adapter.ts
│   │   ├── wfs-adapter.ts
│   │   ├── geojson-adapter.ts
│   │   └── esri-adapter.ts
│   ├── __tests__/                  # Unit tests (vitest)
│   └── README.md                   # Detailed architecture docs
├── dist/                           # Compiled output (generated)
│   ├── index.js
│   ├── *.d.ts
│   └── *.map
├── package.json
├── tsconfig.json
├── LICENSE (MIT)
└── CLAUDE.md (this file)
```

## Common Tasks

### Add New Layer Type

1. Create adapter: `lib/layers/adapters/mytype-adapter.ts`
   ```typescript
   export class MytypeAdapter implements LayerAdapter {
     createDeckLayer(config, onClick) { /* ... */ }
     getInfo(config, coordinate) { /* ... */ }
     supportsQueryFeatures() { return true/false }
   }
   ```

2. Register in factory: `lib/layers/layer-factory.ts`
   ```typescript
   this.register('mytype', new MytypeAdapter())
   ```

3. Update type union: `lib/layers/types.ts`
   ```typescript
   export type LayerType = 'tile' | 'mvt' | 'mytype' | ...
   ```

4. Build & test:
   ```bash
   pnpm run build
   pnpm run test
   ```

### Update Shared Types

1. Edit `lib/layers/types.ts`
2. Build: `pnpm run build`
3. Consumers auto-resolve new types (monorepo via workspace:*, git via fetch on next install)

### Debug Feature Info

Feature info flows through 3 paths depending on layer type:

- **Vector** (GeoJSON, WFS, KML): `clickInfo.object.properties` from deck.gl pick
- **Raster** (tile, WMS): API call → pixel value extraction
- **Esri**: Layer-specific query (MapServer uses QueryTask, FeatureServer uses Query)

Check adapter's `getInfo()` method for the specific type.

## Rules

### Git Operations — STRICTLY FORBIDDEN

**NO git write operations allowed:**
- ❌ `git commit` — FORBIDDEN
- ❌ `git push` — FORBIDDEN
- ❌ `git add` — FORBIDDEN
- ❌ `git rm` — FORBIDDEN
- ❌ `git merge` — FORBIDDEN
- ❌ `git rebase` — FORBIDDEN
- ❌ `git reset` — FORBIDDEN
- ❌ `git checkout` — FORBIDDEN
- ❌ `--force`, `--no-verify`, `--amend` flags — FORBIDDEN
- ❌ Any submodule operations — FORBIDDEN

**Only read-only operations allowed:**
- ✅ `git log` — View commit history
- ✅ `git status` — Check working tree status
- ✅ `git diff` — View changes
- ✅ `git show` — View commit details

**Why:** Part of multi-service monorepo with git submodules. All git operations coordinated at root by authorized personnel.

### Code Quality

- **No `any` types** — Use proper TypeScript types (strict mode enabled)
- **Build before submission** — Ensure dist/ folder is up-to-date with `pnpm run build`
- **Test before submission** — All adapters should pass vitest with `pnpm run test`
- **Document breaking changes** — Update README.md if API changes

## Dependencies

**Runtime:**
- `@deck.gl/geo-layers` — Vector/tile layer rendering
- `@deck.gl/layers` — Core layer types
- `@deck.gl/extensions` — Advanced rendering features

**Dev:**
- `typescript` — Language + type checking
- `vitest` — Unit testing framework

All dependencies should be kept in sync across services (use same versions in dashboard/geoportal for stability).

## References

- Full architecture guide: `lib/layers/README.md`
- Dashboard integration: `../dashboard/CLAUDE.md` (Layer System section)
- Geoportal integration: `../geoportal/CLAUDE.md`
- Deck.gl docs: https://deck.gl/docs/api-reference/layers
