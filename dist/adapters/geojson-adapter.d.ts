import { GeoJsonLayer } from '@deck.gl/layers';
import type { LayerAdapter } from './types';
import type { LayerConfig, FeatureInfoResult } from '../types';
export declare function createStyledGeoJsonLayer(config: LayerConfig, data: unknown, onClick?: (info: any) => void, idPrefix?: string): GeoJsonLayer;
export declare class GeoJsonAdapter implements LayerAdapter {
    createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any;
    getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult>;
    supportsQueryFeatures(): boolean;
}
//# sourceMappingURL=geojson-adapter.d.ts.map