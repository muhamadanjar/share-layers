import type {
  LayerStyle,
  PointStyle,
  LineStringStyle,
  PolygonStyle,
  CategoricalStyle,
  StrokePattern,
  FillPattern,
} from './types'

/**
 * Default styles for each geometry type
 */
export const STYLE_DEFAULTS = {
  Point: {
    fillColor: [74, 144, 226] as [number, number, number],
    strokeColor: [255, 255, 255] as [number, number, number],
    strokeWidth: 1.5,
    opacity: 0.9,
    pointRadius: 6,
  } as PointStyle,

  LineString: {
    strokeColor: [74, 144, 226] as [number, number, number],
    strokeWidth: 2.0,
    opacity: 0.85,
  } as LineStringStyle,

  Polygon: {
    fillColor: [74, 144, 226] as [number, number, number],
    strokeColor: [255, 255, 255] as [number, number, number],
    strokeWidth: 1.0,
    opacity: 0.7,
  } as PolygonStyle,
}

/**
 * Convert RGB color to RGBA with opacity
 */
export function toRGBA(
  rgb: [number, number, number] | undefined,
  opacity: number | undefined = 1
): [number, number, number, number] {
  const color = rgb ?? STYLE_DEFAULTS.Polygon.fillColor
  return [
    (color as [number, number, number])[0],
    (color as [number, number, number])[1],
    (color as [number, number, number])[2],
    Math.round((opacity ?? 1) * 255),
  ]
}

/**
 * Merge geometry-specific style with defaults
 */
export function resolveStyle(
  style: LayerStyle | undefined,
  key: 'Point'
): PointStyle
export function resolveStyle(
  style: LayerStyle | undefined,
  key: 'LineString'
): LineStringStyle
export function resolveStyle(
  style: LayerStyle | undefined,
  key: 'Polygon'
): PolygonStyle
export function resolveStyle(
  style: LayerStyle | undefined,
  key: 'Point' | 'LineString' | 'Polygon'
): PointStyle | LineStringStyle | PolygonStyle {
  const base = STYLE_DEFAULTS[key]
  const override = (style?.[key] ?? {}) as Record<string, unknown>
  return { ...base, ...override } as PointStyle | LineStringStyle | PolygonStyle
}

/**
 * Dash array patterns for stroke styles
 */
export const DASH_ARRAYS: Record<
  StrokePattern,
  [number, number] | [number, number, number, number]
> = {
  solid: [0, 0],
  dashed: [8, 4],
  dotted: [1, 4],
  'dash-dot': [8, 4, 1, 4],
}

/**
 * Create a fill color accessor function for GeoJSON layers.
 * Supports either solid colors or categorical mapping based on feature properties.
 */
export function makeFillColorAccessor(
  geomStyle: PolygonStyle,
  alpha: number
):
  | [number, number, number, number]
  | ((f: { properties: Record<string, unknown> }) => [number, number, number, number]) {
  if (geomStyle.colorMode === 'categorical' && geomStyle.categoricalFill) {
    const { field, colorMap, defaultColor } = geomStyle.categoricalFill
    return (f: { properties: Record<string, unknown> }) => {
      const val = String(f.properties?.[field] ?? '')
      const c = (colorMap[val] ?? defaultColor) as [number, number, number]
      return [c[0], c[1], c[2], alpha]
    }
  }
  return toRGBA(geomStyle.fillColor, geomStyle.opacity ?? 0.7)
}

/**
 * Fill pattern atlas mapping: defines which tile in the atlas contains each pattern.
 * Atlas is 256px wide (4 tiles × 64px) and 64px tall.
 * FillStyleExtension shader uses alpha channel: opaque=show fill, transparent=show fill color.
 */
export const FILL_PATTERN_MAPPING: Record<
  FillPattern,
  { x: number; y: number; width: number; height: number; mask: boolean }
> = {
  solid: { x: 0, y: 0, width: 64, height: 64, mask: true },
  hatched: { x: 64, y: 0, width: 64, height: 64, mask: true },
  'cross-hatched': { x: 128, y: 0, width: 64, height: 64, mask: true },
  dotted: { x: 192, y: 0, width: 64, height: 64, mask: true },
}

let _fillPatternAtlas: HTMLCanvasElement | null = null

/**
 * Get or create the fill pattern atlas canvas.
 * Uses a singleton to avoid recreating the canvas multiple times.
 */
export function getFillPatternAtlas(): HTMLCanvasElement {
  if (!_fillPatternAtlas) {
    _fillPatternAtlas = createFillPatternAtlas()
  }
  return _fillPatternAtlas
}

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
export function createFillPatternAtlas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const T = 64 // tile size
  canvas.width = T * 4
  canvas.height = T
  const ctx = canvas.getContext('2d')!

  // Tile 0 (solid): entire tile opaque white
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, T, T)

  // Tile 1 (hatched 45°): diagonal lines, 3px wide, 8px spacing — clipped to tile bounds
  ctx.save()
  ctx.beginPath()
  ctx.rect(T, 0, T, T)
  ctx.clip()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.lineCap = 'square'
  for (let i = -T; i < T * 2; i += 8) {
    ctx.beginPath()
    ctx.moveTo(T + i, 0)
    ctx.lineTo(T + i + T, T)
    ctx.stroke()
  }
  ctx.restore()

  // Tile 2 (cross-hatched): both diagonals — clipped to tile bounds
  ctx.save()
  ctx.beginPath()
  ctx.rect(T * 2, 0, T, T)
  ctx.clip()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.lineCap = 'square'
  for (let i = -T; i < T * 2; i += 8) {
    ctx.beginPath()
    ctx.moveTo(T * 2 + i, 0)
    ctx.lineTo(T * 2 + i + T, T)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(T * 2 + i + T, 0)
    ctx.lineTo(T * 2 + i, T)
    ctx.stroke()
  }
  ctx.restore()

  // Tile 3 (dotted): dots at 12px grid, 4px radius
  ctx.save()
  ctx.beginPath()
  ctx.rect(T * 3, 0, T, T)
  ctx.clip()
  ctx.fillStyle = 'white'
  for (let y = 6; y < T; y += 12) {
    for (let x = 6; x < T; x += 12) {
      ctx.beginPath()
      ctx.arc(T * 3 + x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  return canvas
}
