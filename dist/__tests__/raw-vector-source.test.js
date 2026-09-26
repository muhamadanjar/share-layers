import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CACHE_BYTES, RawVectorSourceCache, loadRawVectorSource, } from '../raw-vector-source';
const data = (featureCount) => ({
    type: 'FeatureCollection',
    features: Array.from({ length: featureCount }, () => ({ type: 'Feature' })),
});
describe('RawVectorSourceCache', () => {
    it('evicts the least recently used source when its byte budget is exceeded', () => {
        const cache = new RawVectorSourceCache(10);
        cache.set('first', { data: data(1), featureCount: 1, bytes: 5 });
        cache.set('second', { data: data(1), featureCount: 1, bytes: 5 });
        expect(cache.get('first')).toBeDefined();
        cache.set('third', { data: data(1), featureCount: 1, bytes: 5 });
        expect(cache.get('first')).toBeDefined();
        expect(cache.get('second')).toBeUndefined();
        expect(cache.get('third')).toBeDefined();
    });
    it('does not retain a source larger than its cache capacity', () => {
        const cache = new RawVectorSourceCache(10);
        cache.set('oversized', { data: data(1), featureCount: 1, bytes: 11 });
        expect(cache.size).toBe(0);
    });
});
describe('loadRawVectorSource', () => {
    const config = {
        layer_id: 'parcels',
        layer_type: 'shp',
        filename: 'parcels.zip',
        file_type: 'vector',
        tile_url: 'https://example.test/parcels.zip',
        visible: true,
        opacity: 1,
    };
    it('reports an actionable error when Web Workers are unavailable', async () => {
        const statuses = [];
        vi.stubGlobal('Worker', undefined);
        await expect(loadRawVectorSource({
            ...config,
            onSourceStatus: (status) => statuses.push(status.state),
        })).rejects.toThrow('Web Worker');
        expect(statuses).toEqual(['loading', 'error']);
        vi.unstubAllGlobals();
    });
    it('exports the documented default cache budget', () => {
        expect(DEFAULT_CACHE_BYTES).toBe(100 * 1024 * 1024);
    });
});
//# sourceMappingURL=raw-vector-source.test.js.map