import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
export class TileAdapter {
    createDeckLayer(config, onClick) {
        return new TileLayer({
            id: `deck-tile-${config.layer_id}`,
            data: config.tile_url,
            tileSize: 256,
            pickable: true,
            opacity: config.opacity ?? 0.8,
            renderSubLayers: (props) => {
                const { west, south, east, north } = props.tile.bbox;
                return new BitmapLayer(props, {
                    data: undefined,
                    image: props.data,
                    bounds: [west, south, east, north],
                });
            },
        });
    }
    async getInfo(config, coordinate) {
        // Raster tiles not queryable at point level
        return { type: 'none' };
    }
    supportsQueryFeatures() {
        return false;
    }
}
//# sourceMappingURL=tile-adapter.js.map