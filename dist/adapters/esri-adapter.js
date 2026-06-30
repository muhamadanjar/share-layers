import { TileLayer, MVTLayer } from '@deck.gl/geo-layers';
import { GeoJsonLayer, BitmapLayer } from '@deck.gl/layers';
export class EsriAdapter {
    createDeckLayer(config, onClick) {
        switch (config.layer_type) {
            case 'esri_mapserver':
                return this.createMapServerLayer(config);
            case 'esri_tileserver':
                return this.createTileServerLayer(config);
            case 'esri_imageserver':
                return this.createImageServerLayer(config);
            case 'esri_featureserver':
                return this.createFeatureServerLayer(config);
            case 'esri_vectortileserver':
                return this.createVectorTileServerLayer(config);
            default:
                return null;
        }
    }
    createMapServerLayer(config) {
        return new TileLayer({
            id: `deck-esri-mapserver-${config.layer_id}`,
            data: [],
            tileSize: 256,
            pickable: true,
            opacity: config.opacity ?? 0.85,
            getTileData: async (props) => {
                const { x, y, z, bbox } = props.tile || props;
                const meta = config.file_metadata ?? {};
                const params = new URLSearchParams({
                    bbox: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
                    bboxSR: '4326',
                    size: '256,256',
                    imageSR: '4326',
                    format: 'png',
                    transparent: 'true',
                    f: 'image',
                });
                const layerIds = meta?.layers;
                if (layerIds)
                    params.append('layers', layerIds);
                const token = meta?.token;
                if (token)
                    params.append('token', String(token));
                const url = `${config.tile_url}/export?${params}`;
                const resp = await fetch(url);
                if (!resp.ok)
                    return null;
                return resp.blob().then(createImageBitmap);
            },
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
    createTileServerLayer(config) {
        return new TileLayer({
            id: `deck-esri-tileserver-${config.layer_id}`,
            data: `${config.tile_url}/tile/{z}/{y}/{x}`,
            tileSize: 256,
            pickable: true,
            opacity: config.opacity ?? 0.85,
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
    createImageServerLayer(config) {
        return new TileLayer({
            id: `deck-esri-image-${config.layer_id}`,
            data: [],
            tileSize: 256,
            pickable: true,
            opacity: config.opacity ?? 0.85,
            getTileData: async (props) => {
                const { x, y, z, bbox } = props;
                const params = new URLSearchParams({
                    bbox: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
                    bboxSR: '4326',
                    size: '256,256',
                    imageSR: '4326',
                    f: 'image',
                    format: 'png',
                });
                const token = config.file_metadata?.token;
                if (token)
                    params.append('token', String(token));
                const resp = await fetch(`${config.tile_url}/exportImage?${params}`);
                if (!resp.ok)
                    return null;
                return resp.blob().then(createImageBitmap);
            },
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
    createFeatureServerLayer(config) {
        const meta = (config.file_metadata ?? {});
        const layerIdx = meta.layerIndex ?? '0';
        const where = meta.where ?? '1=1';
        const token = meta.token ? `&token=${meta.token}` : '';
        return new GeoJsonLayer({
            id: `deck-esri-feature-${config.layer_id}`,
            data: `${config.tile_url}/${layerIdx}/query?where=${where}&outFields=*&f=geojson${token}`,
            pickable: true,
            stroked: true,
            filled: true,
            lineWidthMinPixels: 2,
            pointRadiusMinPixels: 3,
            getLineColor: [255, 140, 0],
            getFillColor: [255, 165, 0, 160],
        });
    }
    createVectorTileServerLayer(config) {
        const token = config.file_metadata?.token;
        const tokenSuffix = token ? `?token=${token}` : '';
        return new MVTLayer({
            id: `deck-esri-mvt-${config.layer_id}`,
            data: `${config.tile_url}/tile/{z}/{y}/{x}.pbf${tokenSuffix}`,
            pickable: true,
            opacity: config.opacity ?? 0.85,
            filled: true,
            stroked: true,
            lineWidthMinPixels: 1,
            pointRadiusMinPixels: 4,
            getFillColor: [255, 140, 0, 180],
            getLineColor: [200, 100, 0, 230],
            getPointRadius: 4,
            autoHighlight: true,
            highlightColor: [255, 200, 0, 200],
            uniqueIdProperty: 'OBJECTID',
        });
    }
    async getInfo(config, coordinate) {
        return { type: 'none' };
    }
    supportsQueryFeatures() {
        return true;
    }
}
//# sourceMappingURL=esri-adapter.js.map