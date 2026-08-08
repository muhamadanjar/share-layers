import type { LayerConfig, FeatureInfoResult } from '../types';
export interface LayerAdapter {
    /**
     * Create DeckGL layer from config.
     * Returns null if adapter cannot handle this config.
     */
    createDeckLayer(config: LayerConfig, onClick?: (info: any) => void): any | null;
    /**
     * Get feature info at click location (polygon/line: geometry, raster: pixel values).
     * Returns { type: 'none' } if no features found or adapter doesn't support queries.
     */
    getInfo(config: LayerConfig, coordinate: [number, number]): Promise<FeatureInfoResult>;
    /**
     * Whether this adapter supports querying features at a location.
     */
    supportsQueryFeatures(): boolean;
}
//# sourceMappingURL=types.d.ts.map