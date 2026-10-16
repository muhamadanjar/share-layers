import { describe, it, expect, vi } from 'vitest';
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
    it('uses Tileserver GeoServer metadata for the WMS layer name', async () => {
        const config = {
            layer_id: 'published-wms',
            layer_type: 'wms',
            filename: 'published.wms',
            file_type: 'external',
            tile_url: 'http://example.com/geoserver/tileserver/wms',
            visible: true,
            opacity: 1,
            file_metadata: {
                geoserver: {
                    layer_name: 'tileserver:states',
                    wms_url: 'http://example.com/geoserver/tileserver/wms',
                    wfs_url: 'http://example.com/geoserver/tileserver/wfs',
                },
            },
        };
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false });
        try {
            const layer = adapter.createDeckLayer(config);
            const getTileData = layer.props.getTileData;
            await getTileData({ bbox: { west: 100, south: -10, east: 110, north: 0 } });
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('LAYERS=tileserver%3Astates'));
            const renderSubLayers = layer.props.renderSubLayers;
            const subLayer = renderSubLayers({
                id: 'wms-tile-1',
                tile: { bbox: { west: 100, south: -10, east: 110, north: 0 } },
                data: null,
                opacity: 0.4,
            });
            expect(subLayer?.id).toBe('wms-tile-1');
            expect(subLayer?.props.opacity).toBe(0.4);
        }
        finally {
            fetchMock.mockRestore();
        }
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