export type RawVectorLayerType = 'shp' | 'geopackage';
export interface SerializedRequestInit {
    method?: string;
    headers?: [string, string][];
    credentials?: RequestCredentials;
    mode?: RequestMode;
    cache?: RequestCache;
    redirect?: RequestRedirect;
    referrerPolicy?: ReferrerPolicy;
    integrity?: string;
}
export interface RawVectorWorkerRequest {
    id: string;
    layerType: RawVectorLayerType;
    url: string;
    sourceLayer?: string;
    maxSourceBytes: number;
    maxFeatures: number;
    requestInit?: SerializedRequestInit;
}
export interface RawVectorFeatureCollection {
    type: 'FeatureCollection';
    features: Array<Record<string, unknown>>;
}
export interface RawVectorWorkerSuccess {
    id: string;
    ok: true;
    data: RawVectorFeatureCollection;
    featureCount: number;
    estimatedBytes: number;
}
export interface RawVectorWorkerFailure {
    id: string;
    ok: false;
    error: string;
}
export type RawVectorWorkerResponse = RawVectorWorkerSuccess | RawVectorWorkerFailure;
//# sourceMappingURL=raw-vector-protocol.d.ts.map