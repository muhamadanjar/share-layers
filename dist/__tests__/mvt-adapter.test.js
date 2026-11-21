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
    it('uses per-geometry MVT colors and configured point radius', () => {
        const config = {
            layer_id: 'styled-mvt',
            layer_type: 'mvt',
            filename: 'styled.pbf',
            file_type: 'vector',
            tile_url: 'http://example.com/tiles/{z}/{x}/{y}.pbf',
            visible: true,
            opacity: 1,
            file_metadata: {
                style: {
                    Polygon: {
                        colorMode: 'categorical',
                        opacity: 1,
                        categoricalFill: {
                            field: 'land',
                            defaultColor: [255, 0, 255],
                            classes: [{ value: 'forest', fillColor: [0, 180, 0] }],
                        },
                    },
                    Point: {
                        fillColor: [11, 12, 13],
                        strokeColor: [14, 15, 16],
                        pointRadius: 9,
                        opacity: 1,
                    },
                    LineString: {
                        strokeColor: [21, 22, 23],
                        strokeWidth: 4,
                        strokePattern: 'dotted',
                        opacity: 1,
                    },
                },
            },
        };
        const layer = adapter.createDeckLayer(config);
        expect(layer.props.pointRadiusMinPixels).toBe(9);
        expect(layer.props.getPointRadius).toBe(9);
        expect(layer.props.getFillColor({ geometry: { type: 'Polygon' }, properties: { land: 'forest' } })).toEqual([0, 180, 0, 255]);
        expect(layer.props.getFillColor({ geometry: { type: 'Point' } })).toEqual([11, 12, 13, 255]);
        expect(layer.props.getLineColor({ geometry: { type: 'LineString' } })).toEqual([21, 22, 23, 255]);
        expect(layer.props.getLineColor({ geometry: { type: 'Point' } })).toEqual([14, 15, 16, 255]);
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