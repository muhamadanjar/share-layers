import { describe, it, expect } from 'vitest';
import { WMSAdapter } from '../adapters/wms-adapter';
describe('WMSAdapter', () => {
    const adapter = new WMSAdapter();
    it('creates TileLayer for WMS type', () => {
        const config = {
            layer_id: 'test-wms',
            layer_type: 'wms',
            filename: 'test.wms',
            file_type: 'raster',
            tile_url: 'http://example.com/wms',
            visible: true,
            opacity: 0.85,
            file_metadata: {
                layers: 'topp:states',
                format: 'image/png',
            },
        };
        const layer = adapter.createDeckLayer(config);
        expect(layer).toBeDefined();
        expect(layer.id).toBe('deck-wms-test-wms');
    });
    it('returns none for feature info (raster)', async () => {
        const config = {
            layer_id: 'test-wms',
            layer_type: 'wms',
            filename: 'test.wms',
            file_type: 'raster',
            tile_url: 'http://example.com/wms',
            visible: true,
            opacity: 0.85,
        };
        const info = await adapter.getInfo(config, [116, -1]);
        expect(info.type).toBe('none');
    });
    it('supports query features for WMS', () => {
        expect(adapter.supportsQueryFeatures()).toBe(true);
    });
});
//# sourceMappingURL=wms-adapter.test.js.map