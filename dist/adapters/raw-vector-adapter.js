import { createStyledGeoJsonLayer } from './geojson-adapter';
import { loadRawVectorSource } from '../raw-vector-source';
/** Renders browser-loaded SHP ZIP and GeoPackage feature data through GeoJsonLayer. */
export class RawVectorAdapter {
    createDeckLayer(config, onClick) {
        return createStyledGeoJsonLayer(config, loadRawVectorSource(config), onClick, `deck-${config.layer_type}`);
    }
    async getInfo(_config, _coordinate) {
        return { type: 'none' };
    }
    supportsQueryFeatures() {
        return false;
    }
}
//# sourceMappingURL=raw-vector-adapter.js.map