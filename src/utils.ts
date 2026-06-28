/**
 * Type guard: validates bbox is a [west, south, east, north] array
 * - All 4 values must be numbers
 * - west < east (bbox[0] < bbox[2])
 * - south < north (bbox[1] < bbox[3])
 */
export function isValidBbox(bbox: any): bbox is [number, number, number, number] {
  return (
    Array.isArray(bbox) &&
    bbox.length === 4 &&
    bbox.every((v) => typeof v === 'number') &&
    bbox[0] < bbox[2] &&
    bbox[1] < bbox[3]
  )
}

/**
 * Convert zoom level to map scale ratio (e.g., "1:50000")
 * Uses web mercator projection: 40075016.686 meters circumference
 */
export function getScaleString(zoomLevel: number): string {
  const metersPerPixel = 40075016.686 / (256 * Math.pow(2, zoomLevel))
  const scaleRatio = Math.round(metersPerPixel * 3779.528)

  if (scaleRatio <= 0) return '1:∞'
  if (scaleRatio >= 1000000) {
    return `1:${Math.round(scaleRatio / 100000) * 100000}`
  }
  if (scaleRatio >= 100000) {
    return `1:${Math.round(scaleRatio / 10000) * 10000}`
  }
  if (scaleRatio >= 10000) {
    return `1:${Math.round(scaleRatio / 1000) * 1000}`
  }

  return `1:${scaleRatio.toLocaleString()}`
}

/**
 * Substitute {{propertyName}} tokens in template with values
 * - Missing keys produce empty string
 * - Example: renderTemplate("Scale: {{scale}}", { scale: "1:50000" })
 */
export function renderTemplate(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    key in values ? String(values[key]) : ''
  )
}
