# Shared Layer Engine Documentation

Complete guide to the unified layer rendering and feature extraction system used across dashboard and geoportal services.

## Architecture Overview

The layer engine implements two core patterns to handle 15+ different geospatial layer types (tile, vector, MVT, WMS, WFS, Esri, WMTS, etc.) in a single unified interface.

### 1. Adapter Pattern

Each layer type has a dedicated **adapter** that implements the `LayerAdapter` interface:

```typescript
interface LayerAdapter {
  // Create a DeckGL layer for rendering
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any | null;

  // Extract feature info at a coordinate (async)
  getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult>;

  // Whether this adapter can query features
  supportsQueryFeatures(): boolean;
}
```

**Why:** Each layer type has different rendering logic and feature-info methods:
- **Tile layers** (raster tiles, MVT) render pre-tiled data
- **Vector layers** (GeoJSON, WFS) render individual features
- **WMS layers** use GetMap requests with bounding-box queries
- **Esri layers** have custom layer types per service (MapServer, FeatureServer, VectorTileServer, etc.)

### 2. Factory Pattern

A **LayerFactory** registry manages all adapters and delegates layer creation:

```typescript
class LayerFactory {
  private adapters = new Map<LayerType, LayerAdapter>();

  register(type: LayerType, adapter: LayerAdapter): void;
  createLayer(config: LayerConfig, onClick?: (info: any) => void): any | null;
  getAdapter(type: LayerType): LayerAdapter | undefined;
}
```

**Usage:**
```typescript
const layerFactory = new LayerFactory(); // Auto-registers 6 default adapters
const deckglLayer = layerFactory.createLayer(layerConfig, handleClick);
```

## Supported Layer Types (15 Total)

### Core Adapters

| Type | Adapter | Rendering | Feature Info |
|------|---------|-----------|--------------|
| `tile` | TileAdapter | Raster tiles (PNG, WebP) | ❌ None |
| `vector` | TileAdapter | Vector tiles (PNG) | ❌ None |
| `mbtiles` | TileAdapter | MBTiles format | ❌ None |
| `mvt` | MVTAdapter | Mapbox Vector Tiles | ⚠️ Limited (deck.gl) |
| `geojson` | GeojsonAdapter | Direct GeoJSON | ⚠️ From click handler |
| `kml` | GeojsonAdapter | KML→GeoJSON conversion | ⚠️ From click handler |
| `wms` | WMSAdapter | WMS GetMap requests | ✅ GetFeatureInfo HTTP |
| `wmts` | WMTSAdapter | WMTS GetTile requests | ❌ None |
| `wfs` | WFSAdapter | WFS GetFeature requests | ✅ Feature properties |
| `esri_mapserver` | EsriAdapter | Esri MapServer | ✅ Query endpoint |
| `esri_tileserver` | EsriAdapter | Esri TileServer | ❌ None |
| `esri_imageserver` | EsriAdapter | Esri ImageServer | ⚠️ Export endpoint |
| `esri_featureserver` | EsriAdapter | Esri FeatureServer | ✅ Query endpoint |
| `esri_vectortileserver` | EsriAdapter | Esri VectorTileServer | ❌ None |

**Legend:**
- ✅ Full feature querying support
- ⚠️ Partial/limited support
- ❌ No feature info available

## Usage Examples

### 1. Basic Layer Rendering

```typescript
import { layerFactory } from '@/lib/layers';

const config: LayerConfig = {
  layer_id: 'buildings_layer',
  layer_type: 'mvt',
  filename: 'buildings.mbtiles',
  file_type: 'vector',
  tile_url: 'https://tiles.example.com/buildings/{z}/{x}/{y}.pbf',
  visible: true,
  opacity: 0.8,
  bbox: [-180, -85, 180, 85],
};

// Create DeckGL layer
const deckglLayer = layerFactory.createLayer(config, handleClick);
deckglLayers.push(deckglLayer);
```

### 2. Feature Info Retrieval on Click

```typescript
const handleMapClick = async (clickInfo: any) => {
  const coordinate: [number, number] = [clickInfo.coordinate[0], clickInfo.coordinate[1]];
  
  // Get adapter for layer
  const adapter = layerFactory.getAdapter(layer.layer_type);
  if (!adapter) return;

  // Retrieve feature info (polymorphic)
  const info = await adapter.getInfo(layer, coordinate);
  
  // Handle result
  switch (info.type) {
    case 'vector':
      console.log('Features:', info.features); // Array of properties
      break;
    case 'raster':
      console.log('Pixel values:', info.values); // { band1: 255, band2: 128 }
      break;
    case 'none':
      console.log('No features found');
  }
};
```

### 3. Rendering Feature Properties (3 Modes)

```typescript
import { renderFeatureProperties } from '@/lib/layers/metadata-renderer';

const feature = { name: 'Main Street', length: 5000, type: 'primary' };
const metadata: FileMetadata = {
  renderMode: 'fields',
  fields: [
    { original: 'name', label: 'Street Name', visible: true },
    { original: 'length', label: 'Length (m)', visible: true },
    { original: 'type', label: 'Type', visible: false },
  ],
};

const result = renderFeatureProperties(feature, metadata);
// result.mode = 'fields'
// result.fields = [
//   { key: 'name', label: 'Street Name', value: 'Main Street' },
//   { key: 'length', label: 'Length (m)', value: '5000' },
// ]
```

**Three rendering modes:**

1. **original** (default) — All feature properties displayed
   ```typescript
   renderMode: 'original'
   // Shows: { name: 'Main Street', length: 5000, type: 'primary', ... }
   ```

2. **fields** — Select visible properties with custom labels
   ```typescript
   renderMode: 'fields'
   fields: [
     { original: 'name', label: 'Street Name', visible: true },
     { original: 'length', label: 'Length (m)', visible: true },
   ]
   ```

3. **custom** — Template-based rendering with `{{ field }}` substitution
   ```typescript
   renderMode: 'custom'
   custom: '<strong>{{ name }}</strong><br>{{ length }}m'
   // Output: <strong>Main Street</strong><br>5000m
   ```

### 4. Styling Layers

```typescript
const config: LayerConfig = {
  // ...
  file_metadata: {
    style: {
      Polygon: {
        fillColor: [200, 50, 50],      // RGB
        fillPattern: 'hatched',         // 'solid' | 'hatched' | 'cross-hatched' | 'dotted'
        strokeColor: [100, 20, 20],
        strokePattern: 'dashed',        // 'solid' | 'dashed' | 'dotted' | 'dash-dot'
        strokeWidth: 2,
        opacity: 0.7,
      },
      LineString: {
        strokeColor: [0, 100, 200],
        strokeWidth: 3,
        strokePattern: 'solid',
        opacity: 1.0,
      },
      Point: {
        fillColor: [255, 200, 0],
        strokeColor: [100, 100, 100],
        pointRadius: 6,
        opacity: 0.9,
      },
    },
  },
};
```

**Categorical styling** (color by feature property):

```typescript
const config: LayerConfig = {
  // ...
  file_metadata: {
    style: {
      Polygon: {
        colorMode: 'categorical',
        categoricalFill: {
          field: 'type',  // Property to group by
          colorMap: {
            'commercial': [200, 50, 50],
            'residential': [50, 150, 50],
            'industrial': [100, 100, 200],
          },
          defaultColor: [200, 200, 200],  // Fallback
        },
      },
    },
  },
};
```

## Adding New Layer Types (5-Step Process)

### Step 1: Define Config Interface

**File:** `services/shared/lib/layers/types.ts`

```typescript
// Add to LayerType union
export type LayerType = 
  | 'tile'
  | 'mytype'  // ← New type
  | ...;
```

### Step 2: Create Adapter

**File:** `services/shared/lib/layers/adapters/mytype-adapter.ts`

```typescript
import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';
import { CustomLayerClass } from 'custom-deck-lib';

export class MytypeAdapter implements LayerAdapter {
  createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any | null {
    // Validate config has required fields
    if (!config.tile_url) return null;

    // Create and return DeckGL layer
    return new CustomLayerClass({
      id: `deck-mytype-${config.layer_id}`,
      data: config.tile_url,
      pickable: true,
      onClick,
      // ... adapter-specific props
    });
  }

  async getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult> {
    try {
      // Fetch feature info from your API
      const response = await fetch(`${config.tile_url}/query?x=${coordinate[0]}&y=${coordinate[1]}`);
      const data = await response.json();
      
      return {
        type: 'vector',
        count: data.features.length,
        features: data.features,
      };
    } catch (error) {
      console.error('Feature query failed:', error);
      return { type: 'none' };
    }
  }

  supportsQueryFeatures(): boolean {
    return true;
  }
}
```

### Step 3: Register in Factory

**File:** `services/shared/lib/layers/layer-factory.ts`

```typescript
import { MytypeAdapter } from './adapters/mytype-adapter';

private registerDefaultAdapters(): void {
  // ... existing adapters
  this.register('mytype', new MytypeAdapter());
}
```

### Step 4: Update Imports (if used locally)

**File:** `services/{dashboard,geoportal}/lib/layers.ts` (if it re-exports)

```typescript
export { MytypeAdapter } from '@shared/lib/layers/adapters/mytype-adapter';
```

### Step 5: Test with Sample Config

```typescript
const testConfig: LayerConfig = {
  layer_id: 'test_mytype',
  layer_type: 'mytype',
  filename: 'test.ext',
  file_type: 'external',
  tile_url: 'https://api.example.com/data',
  visible: true,
  opacity: 0.8,
};

const layer = layerFactory.createLayer(testConfig);
expect(layer).toBeTruthy();
expect(layer.id).toBe('deck-mytype-test_mytype');
```

## Testing Guidelines

### Unit Tests

Test each adapter independently:

```typescript
// services/shared/lib/layers/__tests__/mytype-adapter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MytypeAdapter } from '../adapters/mytype-adapter';

describe('MytypeAdapter', () => {
  it('should create a valid DeckGL layer', () => {
    const adapter = new MytypeAdapter();
    const config: LayerConfig = { /* ... */ };
    
    const layer = adapter.createDeckLayer(config);
    expect(layer).toBeTruthy();
    expect(layer.id).toContain('mytype');
  });

  it('should return feature info for valid coordinates', async () => {
    const adapter = new MytypeAdapter();
    const config: LayerConfig = { /* ... */ };
    
    const info = await adapter.getInfo(config, [0, 0]);
    expect(info.type).toEqual('vector');
  });

  it('should return none when query fails', async () => {
    const adapter = new MytypeAdapter();
    const config: LayerConfig = { tile_url: 'invalid://url' };
    
    const info = await adapter.getInfo(config, [0, 0]);
    expect(info.type).toEqual('none');
  });
});
```

### Integration Tests

Test factory + adapter interaction:

```typescript
// services/shared/lib/layers/__tests__/layer-factory.test.ts
import { describe, it, expect } from 'vitest';
import { LayerFactory } from '../layer-factory';

describe('LayerFactory', () => {
  it('should register and retrieve adapters', () => {
    const factory = new LayerFactory();
    const adapter = factory.getAdapter('mvt');
    
    expect(adapter).toBeDefined();
    expect(adapter?.supportsQueryFeatures()).toEqual(true);
  });

  it('should create layers for all registered types', () => {
    const factory = new LayerFactory();
    const config: LayerConfig = { /* ... */ };
    
    ['tile', 'mvt', 'wms', 'wfs', 'esri_mapserver'].forEach((type) => {
      config.layer_type = type as any;
      const layer = factory.createLayer(config);
      expect(layer).toBeTruthy();
    });
  });
});
```

### Testing Styles

```typescript
// services/shared/lib/layers/__tests__/metadata-renderer.test.ts
describe('renderFeatureProperties', () => {
  it('should render with fields mode', () => {
    const feature = { name: 'Test', value: 42 };
    const metadata: FileMetadata = {
      renderMode: 'fields',
      fields: [
        { original: 'name', label: 'Name', visible: true },
        { original: 'value', label: 'Value', visible: false },
      ],
    };

    const result = renderFeatureProperties(feature, metadata);
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].label).toBe('Name');
  });

  it('should render with custom template mode', () => {
    const feature = { name: 'Main St', length: 500 };
    const metadata: FileMetadata = {
      renderMode: 'custom',
      custom: '{{ name }} ({{ length }}m)',
    };

    const result = renderFeatureProperties(feature, metadata);
    expect(result.fields[0].value).toContain('Main St');
  });
});
```

## Performance Notes

### Layer Rendering

1. **Memoization:** Wrap layer creation in `useMemo()` to prevent recreation on component re-renders
   ```typescript
   const deckglLayers = useMemo(() => 
     config.layers.map(c => layerFactory.createLayer(c, handleClick)),
     [config.layers, handleClick]
   );
   ```

2. **Deck.gl Picking:** Set `pickable: false` on layers that don't need click handling
   ```typescript
   return new TileLayer({
     id: `deck-tile-${config.layer_id}`,
     data: config.tile_url,
     pickable: false,  // ← Improves performance if not querying
   });
   ```

3. **Feature Caching:** Adapters should cache API responses
   ```typescript
   private featureCache = new Map<string, FeatureInfoResult>();

   async getInfo(config: LayerConfig, coordinate: [number, number]) {
     const key = `${config.layer_id}:${coordinate.join(',')}`;
     if (this.featureCache.has(key)) {
       return this.featureCache.get(key)!;
     }
     const result = await this.queryAPI(...);
     this.featureCache.set(key, result);
     return result;
   }
   ```

### Metadata Rendering

The `renderFeatureProperties` function is synchronous and fast (< 1ms for typical features). No special optimization needed.

## Future Enhancements

### Planned Features

1. **Adapter Chaining** — Compose adapters for complex transformations
   ```typescript
   const chain = new AdapterChain()
     .add(new FilterAdapter())
     .add(new StyleAdapter())
     .add(new CacheAdapter());
   ```

2. **Dynamic Registration** — Load adapters from plugins
   ```typescript
   layerFactory.registerPlugin('mytype', () => import('./adapters/mytype'));
   ```

3. **Three.js Support** — In addition to Deck.gl
   ```typescript
   createLayer(config, { renderer: 'three.js' });
   ```

4. **Real-time Streaming** — WebSocket support for live data
   ```typescript
   config.tile_url = 'wss://stream.example.com/features';
   ```

5. **Offline Support** — IndexedDB caching for layers
   ```typescript
   const adapter = new OfflineAdapter(new MVTAdapter());
   ```

## Files Reference

### Core Files

| File | Purpose |
|------|---------|
| `types.ts` | LayerConfig, LayerStyle, FeatureInfoResult types |
| `layer-factory.ts` | Factory registry + adapter registration |
| `adapters/types.ts` | LayerAdapter interface definition |
| `style-helpers.ts` | Color conversion, pattern mapping, style resolution |
| `metadata-renderer.ts` | Feature property rendering (3 modes) |
| `feature-info-provider.ts` | Polymorphic feature info retrieval |

### Adapter Implementations

| File | Handles |
|------|---------|
| `adapters/tile-adapter.ts` | Raster tiles, vectors, mbtiles |
| `adapters/mvt-adapter.ts` | Mapbox vector tiles with patterns |
| `adapters/geojson-adapter.ts` | Direct GeoJSON rendering |
| `adapters/wms-adapter.ts` | WMS GetMap + GetFeatureInfo |
| `adapters/wmts-adapter.ts` | WMTS tile requests |
| `adapters/wfs-adapter.ts` | WFS GetFeature + properties |
| `adapters/esri-adapter.ts` | All Esri service types |

### Tests

| File | Covers |
|------|--------|
| `__tests__/layer-factory.test.ts` | Factory registration + creation |
| `__tests__/*/adapter.test.ts` | Each adapter independently |
| `__tests__/metadata-renderer.test.ts` | Feature property rendering |
| `__tests__/feature-info-provider.test.ts` | Polymorphic queries |

## Troubleshooting

### Layer Not Rendering

**Checklist:**
1. Is `layer.visible === true`?
2. Is `layer_type` registered in factory?
3. Does `createDeckLayer()` return non-null?
4. Is `tile_url` valid and accessible?
5. Check browser console for adapter errors

### Feature Click Not Working

**Checklist:**
1. Is layer `pickable: true` in DeckGL config?
2. Does adapter implement `getInfo()`?
3. Does adapter return non-`{ type: 'none' }`?
4. Is click handler passed to `createLayer()`?
5. Check Network tab for API timeouts

### Styling Not Applied

**Checklist:**
1. Is `file_metadata.style` defined in config?
2. Are colors valid RGB arrays `[0-255, 0-255, 0-255]`?
3. Is `fillPattern` a valid value?
4. Are styles applied to correct geometry type (Point/LineString/Polygon)?

## Resources

- **Deck.gl:** https://deck.gl/docs
- **MapLibre GL:** https://maplibre.org/maplibre-gl-js/
- **OGC Standards:** WMS, WMTS, WFS specifications
- **Esri REST API:** https://developers.arcgis.com/rest/services-reference/
