import type { LayerType, LayerConfig } from './types';
import type { LayerAdapter } from './adapters/types';
import { TileAdapter } from './adapters/tile-adapter';
import { MVTAdapter } from './adapters/mvt-adapter';
import { EsriAdapter } from './adapters/esri-adapter';
import { WMSAdapter } from './adapters/wms-adapter';
import { WMTSAdapter } from './adapters/wmts-adapter';
import { WFSAdapter } from './adapters/wfs-adapter';
import { GeoJsonAdapter } from './adapters/geojson-adapter';

export class LayerFactory {
  private adapters = new Map<LayerType, LayerAdapter>();

  constructor() {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    this.register('tile', new TileAdapter());
    this.register('vector', new TileAdapter());
    this.register('mbtiles', new TileAdapter());
    this.register('mvt', new MVTAdapter());
    const esriAdapter = new EsriAdapter();
    this.register('esri_mapserver', esriAdapter);
    this.register('esri_tileserver', esriAdapter);
    this.register('esri_imageserver', esriAdapter);
    this.register('esri_featureserver', esriAdapter);
    this.register('esri_vectortileserver', esriAdapter);
    this.register('wms', new WMSAdapter());
    this.register('wmts', new WMTSAdapter());
    this.register('wfs', new WFSAdapter());
    const geoJsonAdapter = new GeoJsonAdapter();
    this.register('geojson', geoJsonAdapter);
    this.register('kml', geoJsonAdapter);
  }

  register(type: LayerType, adapter: LayerAdapter): void {
    this.adapters.set(type, adapter);
  }

  createLayer(config: LayerConfig, onClick?: (info: any) => void): any | null {
    const adapter = this.getAdapter(config.layer_type);
    if (!adapter) return null;
    return adapter.createDeckLayer(config, onClick);
  }

  getAdapter(type: LayerType): LayerAdapter | undefined {
    return this.adapters.get(type);
  }
}

export const layerFactory = new LayerFactory();
