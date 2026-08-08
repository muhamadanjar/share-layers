import { describe, it, expect } from 'vitest';
import { MVTAdapter } from '../adapters/mvt-adapter';
describe('MVTAdapter', () => {
    const adapter = new MVTAdapter();
    it('creates MVTLayer for mvt type', () => {
        const config = {
            layer_id: 'test-mvt',
            layer_type: 'mvt',
            filename: 'test.pbf',
            file_type: 'vector',
            tile_url: 'http://example.com/tiles/{z}/{x}/{y}.pbf',
            visible: true,
            opacity: 0.85,
        };
        const layer = adapter.createDeckLayer(config);
        expect(layer).toBeDefined();
    });
    it('returns none for feature info', async () => {
        const config = {
            layer_id: 'test-mvt',
            layer_type: 'mvt',
            filename: 'test.pbf',
            file_type: 'vector',
            tile_url: 'http://example.com/tiles/{z}/{x}/{y}.pbf',
            visible: true,
            opacity: 0.85,
        };
        const info = await adapter.getInfo(config, [116, -1]);
        expect(info.type).toBe('none');
    });
    it('supports query features', () => {
        expect(adapter.supportsQueryFeatures()).toBe(true);
    });
});
//# sourceMappingURL=mvt-adapter.test.js.map