/**
 * Type guard: validates bbox is a [west, south, east, north] array
 * - All 4 values must be numbers
 * - west < east (bbox[0] < bbox[2])
 * - south < north (bbox[1] < bbox[3])
 */
export declare function isValidBbox(bbox: any): bbox is [number, number, number, number];
/**
 * Convert zoom level to map scale ratio (e.g., "1:50000")
 * Uses web mercator projection: 40075016.686 meters circumference
 */
export declare function getScaleString(zoomLevel: number): string;
/**
 * Substitute {{propertyName}} tokens in template with values
 * - Missing keys produce empty string
 * - Example: renderTemplate("Scale: {{scale}}", { scale: "1:50000" })
 */
export declare function renderTemplate(template: string, values: Record<string, unknown>): string;
//# sourceMappingURL=utils.d.ts.map