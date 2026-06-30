export type LayerType = 'tile' | 'vector' | 'mvt' | 'mbtiles' | 'geojson' | 'kml' | 'wms' | 'wmts' | 'wfs' | 'esri_mapserver' | 'esri_tileserver' | 'esri_imageserver' | 'esri_featureserver' | 'esri_vectortileserver';
export type FileType = 'vector' | 'raster' | 'external';
export type StrokePattern = 'solid' | 'dashed' | 'dotted' | 'dash-dot';
export type FillPattern = 'solid' | 'hatched' | 'cross-hatched' | 'dotted';
export interface LayerConfig {
    layer_id: string;
    layer_type: LayerType;
    filename: string;
    file_type: FileType;
    tile_url: string;
    visible: boolean;
    opacity: number;
    bbox?: [number, number, number, number];
    file_metadata?: FileMetadata;
}
export interface TileProcess {
    percent: number;
    tiles_done?: number;
    tiles_total?: number;
    current_zoom?: number;
    status: 'processing' | 'done' | 'failed';
}
export interface DownloadProcess {
    status: 'pending' | 'processing' | 'done' | 'failed' | 'cancelled';
    percent?: number;
    task_id?: string;
    started_at?: string;
    finished_at?: string;
    current_sublayer?: string;
    sublayers_done?: number;
    sublayers_total?: number;
    features_done?: number;
    features_total?: number;
    error?: string;
    manifest?: unknown;
}
export interface FileMetadata {
    style?: LayerStyle;
    renderMode?: 'original' | 'fields' | 'custom';
    fields?: FieldConfig[];
    custom?: string;
    tile_process?: TileProcess;
    download_process?: DownloadProcess;
    [key: string]: unknown;
}
export interface PointStyle {
    fillColor?: [number, number, number];
    strokeColor?: [number, number, number];
    strokeWidth?: number;
    pointRadius?: number;
    opacity?: number;
    colorMode?: 'solid' | 'categorical';
    categoricalFill?: CategoricalStyle;
}
export interface LineStringStyle {
    strokeColor?: [number, number, number];
    strokeWidth?: number;
    strokePattern?: 'solid' | 'dashed' | 'dotted' | 'dash-dot';
    opacity?: number;
}
export interface PolygonStyle {
    fillColor?: [number, number, number];
    fillPattern?: 'solid' | 'hatched' | 'cross-hatched' | 'dotted';
    strokeColor?: [number, number, number];
    strokeWidth?: number;
    strokePattern?: 'solid' | 'dashed' | 'dotted' | 'dash-dot';
    opacity?: number;
    colorMode?: 'solid' | 'categorical';
    categoricalFill?: CategoricalStyle;
}
export interface LayerStyle {
    Point?: PointStyle;
    LineString?: LineStringStyle;
    Polygon?: PolygonStyle;
    categoricalFill?: CategoricalStyle;
    categoricalLine?: CategoricalStyle;
}
export interface CategoricalStyle {
    field: string;
    colorMap: Record<string, [number, number, number]>;
    defaultColor: [number, number, number];
}
export interface FieldConfig {
    original: string;
    label: string;
    visible: boolean;
}
export type FeatureInfoResult = {
    type: 'vector';
    count: number;
    features: Record<string, unknown>[];
} | {
    type: 'raster';
    count: number;
    values: Record<string, number>;
} | {
    type: 'none';
};
export interface MapClickInfo {
    coordinate: [number, number];
    layerId: string;
    layerType: LayerType;
    featureGeometry?: any;
}
//# sourceMappingURL=types.d.ts.map