import { describe, it, expect, beforeEach } from 'vitest';
import { LayerFactory } from '../layer-factory';
describe('LayerFactory', () => {
    let factory;
    beforeEach(() => {
        factory = new LayerFactory();
    });
    it('registers tile adapter on init', () => {
        const adapter = factory.getAdapter('tile');
        expect(adapter).toBeDefined();
    });
    it('getAdapter returns undefined for unregistered type', () => {
        const adapter = factory.getAdapter('unknown');
        expect(adapter).toBeUndefined();
    });
    it('createLayer returns null for unknown type', () => {
        const config = {
            layer_id: 'test',
            layer_type: 'unknown',
            filename: 'test.tif',
            file_type: 'raster',
            tile_url: 'http://example.com',
            visible: true,
            opacity: 1,
        };
        const layer = factory.createLayer(config);
        expect(layer).toBeNull();
    });
});
//# sourceMappingURL=layer-factory.test.js.map