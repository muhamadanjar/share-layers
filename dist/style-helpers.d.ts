import type { LayerStyle, PointStyle, LineStringStyle, PolygonStyle, StrokePattern, FillPattern } from './types';
/**
 * Default styles for each geometry type
 */
export declare const STYLE_DEFAULTS: {
    Point: PointStyle;
    LineString: LineStringStyle;
    Polygon: PolygonStyle;
};
/**
 * Convert RGB color to RGBA with opacity
 */
export declare function toRGBA(rgb: [number, number, number] | undefined, opacity?: number | undefined): [number, number, number, number];
/**
 * Merge geometry-specific style with defaults
 */
export declare function resolveStyle(style: LayerStyle | undefined, key: 'Point'): PointStyle;
export declare function resolveStyle(style: LayerStyle | undefined, key: 'LineString'): LineStringStyle;
export declare function resolveStyle(style: LayerStyle | undefined, key: 'Polygon'): PolygonStyle;
/**
 * Dash array patterns for stroke styles
 */
export declare const DASH_ARRAYS: Record<StrokePattern, [
    number,
    number
] | [number, number, number, number]>;
/**
 * Create a fill color accessor function for GeoJSON layers.
 * Supports either solid colors or categorical mapping based on feature properties.
 */
export declare function makeFillColorAccessor(geomStyle: PolygonStyle, alpha: number): [number, number, number, number] | ((f: {
    properties: Record<string, unknown>;
}) => [number, number, number, number]);
/**
 * Fill pattern atlas mapping: defines which tile in the atlas contains each pattern.
 * Atlas is 256px wide (4 tiles × 64px) and 64px tall.
 * FillStyleExtension shader uses alpha channel: opaque=show fill, transparent=show fill color.
 */
export declare const FILL_PATTERN_MAPPING: Record<FillPattern, {
    x: number;
    y: number;
    width: number;
    height: number;
    mask: boolean;
}>;
/**
 * Get or create the fill pattern atlas canvas.
 * Uses a singleton to avoid recreating the canvas multiple times.
 */
export declare function getFillPatternAtlas(): HTMLCanvasElement;
/**
 * Create the fill pattern atlas canvas.
 * Draws 4 patterns (solid, hatched, cross-hatched, dotted) into a single canvas.
 *
 * Pattern rationale:
 * - solid: entirely opaque white
 * - hatched: 45° diagonal lines at 3px width, 8px spacing
 * - cross-hatched: both diagonals at 2px width, 8px spacing
 * - dotted: 4px radius dots at 12px grid
 *
 * The FillStyleExtension shader applies: color.a *= patternColor.a
 * Transparent pixels (alpha=0) render the fill color; opaque white (alpha=255) shows the fill.
 */
export declare function createFillPatternAtlas(): HTMLCanvasElement;
//# sourceMappingURL=style-helpers.d.ts.map