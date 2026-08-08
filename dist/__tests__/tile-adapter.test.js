import { describe, it, expect } from 'vitest';
import { TileAdapter } from '../adapters/tile-adapter';
describe('TileAdapter', () => {
    const adapter = new TileAdapter();
    it('creates BitmapLayer for tile type', () => {
        const config = {
            layer_id: 'test-tile',
            layer_type: 'tile',
            filename: 'test.tif',
            file_type: 'raster',
            tile_url: 'http://example.com/tiles/{z}/{x}/{y}.png',
            visible: true,
            opacity: 0.8,
        };
        const layer = adapter.createDeckLayer(config);
        expect(layer).toBeDefined();
    });
    it('returns none for feature info (raster tiles not queryable)', async () => {
        const config = {
            layer_id: 'test-tile',
            layer_type: 'tile',
            filename: 'test.tif',
            file_type: 'raster',
            tile_url: 'http://example.com/tiles/{z}/{x}/{y}.png',
            visible: true,
            opacity: 0.8,
        };
        const info = await adapter.getInfo(config, [116, -1]);
        expect(info.type).toBe('none');
    });
    it('does not support query features', () => {
        expect(adapter.supportsQueryFeatures()).toBe(false);
    });
});
//# sourceMappingURL=tile-adapter.test.js.map