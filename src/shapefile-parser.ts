import { unzipSync } from 'fflate';
import type { RawVectorFeatureCollection } from './raw-vector-protocol';

interface ZipEntries {
  [name: string]: Uint8Array;
}

interface ShapefileRecord {
  geometry: Record<string, unknown> | null;
}

interface ShapefileData {
  records: ShapefileRecord[];
}

interface DbfField {
  name: string;
  type: string;
  length: number;
}

type CoordinateTransform = (x: number, y: number) => [number, number];

const SUPPORTED_SHAPE_TYPES: Record<number, true> = {
  1: true,
  3: true,
  5: true,
  8: true,
  11: true,
  13: true,
  15: true,
  18: true,
  21: true,
  23: true,
  25: true,
  28: true,
};

function readError(sourceLayer: string, message: string): Error {
  return new Error(`Shapefile '${sourceLayer}' is malformed: ${message}`);
}

function shapeFamily(shapeType: number): number {
  if (shapeType === 0) return 0;
  if (shapeType === 1 || shapeType === 11 || shapeType === 21) return 1;
  if (shapeType === 3 || shapeType === 13 || shapeType === 23) return 3;
  if (shapeType === 5 || shapeType === 15 || shapeType === 25) return 5;
  if (shapeType === 8 || shapeType === 18 || shapeType === 28) return 8;
  return -1;
}

function findZipEntry(entries: ZipEntries, expectedName: string): Uint8Array | undefined {
  const entryName = Object.keys(entries).find((name) => name.toLowerCase() === expectedName.toLowerCase());
  return entryName ? entries[entryName] : undefined;
}

function selectSourceLayer(available: string[], selected: string | undefined): string {
  if (selected) {
    if (available.includes(selected)) return selected;
    throw new Error(`Shapefile ZIP source_layer '${selected}' was not found. Available layers: ${available.join(', ')}.`);
  }
  if (available.length === 1) return available[0];
  if (available.length === 0) throw new Error('Shapefile ZIP source contains no .shp feature layers.');
  throw new Error(`Shapefile ZIP source has multiple layers (${available.join(', ')}). Set source_layer explicitly.`);
}

function assertShapefileCrs(prj: Uint8Array | undefined, sourceLayer: string): boolean {
  if (!prj) {
    throw new Error(`Shapefile '${sourceLayer}' is missing a .prj file. Only EPSG:4326 and EPSG:3857 are supported.`);
  }

  const definition = new TextDecoder().decode(prj);
  const isWebMercator = /(?:EPSG[^\d]*3857|AUTHORITY\s*\[\s*["']EPSG["']\s*,\s*["']3857["']\s*\]|(?:Pseudo|Web)[ _-]?Mercator)/i.test(definition);
  if (isWebMercator) return true;

  const hasExplicitWgs84Code = /(?:EPSG[^\d]*4326|AUTHORITY\s*\[\s*["']EPSG["']\s*,\s*["']4326["']\s*\])/i.test(definition);
  const isGeographicWgs84 = /(?:GEOGCS|GEOGCRS)\s*\[/i.test(definition)
    && /WGS[_ -]?(?:19)?84/i.test(definition);
  if (
    (hasExplicitWgs84Code || isGeographicWgs84)
    && !/(?:PROJCS|PROJCRS|GEOCCS|GEOCS|GEOCENTRIC)/i.test(definition)
  ) return false;

  throw new Error(`Shapefile '${sourceLayer}' uses an unsupported CRS. Only EPSG:4326 and EPSG:3857 are supported.`);
}

function assertFeatureLimit(count: number, maxFeatures: number): void {
  if (count > maxFeatures) {
    throw new Error(`Source has ${count.toLocaleString()} features, exceeding the ${maxFeatures.toLocaleString()} feature limit.`);
  }
}

function readNumber(view: DataView, offset: number, littleEndian: boolean, sourceLayer: string): number {
  if (offset < 0 || offset + 8 > view.byteLength) throw readError(sourceLayer, 'record ended while reading coordinates');
  const value = view.getFloat64(offset, littleEndian);
  if (!Number.isFinite(value)) throw readError(sourceLayer, 'record contains a non-finite coordinate');
  return value;
}

function mercatorToWgs84(x: number, y: number): [number, number] {
  const radius = 6378137;
  const longitude = (x / radius) * (180 / Math.PI);
  const latitude = (2 * Math.atan(Math.exp(y / radius)) - Math.PI / 2) * (180 / Math.PI);
  return [longitude, Math.max(-90, Math.min(90, latitude))];
}

function readPoint(
  view: DataView,
  offset: number,
  transform: CoordinateTransform,
  sourceLayer: string,
  z?: number,
): number[] {
  const point = transform(
    readNumber(view, offset, true, sourceLayer),
    readNumber(view, offset + 8, true, sourceLayer),
  );
  return z === undefined ? point : [...point, z];
}

function readMeasureSection(view: DataView, offset: number, count: number, sourceLayer: string): number[] {
  if (offset < 0 || offset + 16 + count * 8 > view.byteLength) {
    throw readError(sourceLayer, 'record ended while reading shape measures');
  }
  readNumber(view, offset, true, sourceLayer);
  readNumber(view, offset + 8, true, sourceLayer);
  const values: number[] = [];
  for (let index = 0; index < count; index += 1) {
    values.push(readNumber(view, offset + 16 + index * 8, true, sourceLayer));
  }
  return values;
}

function readParts(
  view: DataView,
  offset: number,
  numParts: number,
  numPoints: number,
  transform: CoordinateTransform,
  sourceLayer: string,
  zValues?: number[],
): number[][][] {
  if (numParts <= 0 || numPoints <= 0) throw readError(sourceLayer, 'record has no parts or points');
  const partsOffset = offset;
  const pointsOffset = partsOffset + numParts * 4;
  if (pointsOffset + numPoints * 16 > view.byteLength) throw readError(sourceLayer, 'record ended while reading parts');

  const starts: number[] = [];
  for (let index = 0; index < numParts; index += 1) {
    const start = view.getInt32(partsOffset + index * 4, true);
    if (start < 0 || start >= numPoints || (index === 0 && start !== 0) || (index > 0 && start <= starts[index - 1])) {
      throw readError(sourceLayer, 'record contains invalid part indexes');
    }
    starts.push(start);
  }

  const points: number[][] = [];
  for (let index = 0; index < numPoints; index += 1) {
    points.push(readPoint(view, pointsOffset + index * 16, transform, sourceLayer, zValues?.[index]));
  }

  return starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : points.length;
    return points.slice(start, end).map((point) => [...point]);
  });
}

function signedArea(ring: number[][]): number {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const next = (index + 1) % ring.length;
    area += ring[index][0] * ring[next][1] - ring[next][0] * ring[index][1];
  }
  return area / 2;
}

function pointInRing(point: number[], ring: number[][]): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x, y] = ring[index];
    const [previousX, previousY] = ring[previous];
    if ((y > point[1]) !== (previousY > point[1])
      && point[0] < ((previousX - x) * (point[1] - y)) / (previousY - y) + x) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonGeometry(parts: number[][][]): Record<string, unknown> {
  const rings = parts.map((ring) => {
    const closed = ring.length > 0 && ring[0][0] === ring[ring.length - 1][0]
      && ring[0][1] === ring[ring.length - 1][1];
    return closed ? ring : [...ring, [...ring[0]]];
  });
  const outerIndexes: number[] = [];
  const holeIndexes = new Map<number, number[]>();
  for (let index = 0; index < rings.length; index += 1) {
    let containingCount = 0;
    for (let other = 0; other < rings.length; other += 1) {
      if (index !== other && pointInRing(rings[index][0], rings[other])) containingCount += 1;
    }
    if (containingCount % 2 === 0) outerIndexes.push(index);
  }
  if (outerIndexes.length === 0) outerIndexes.push(0);
  for (const outerIndex of outerIndexes) holeIndexes.set(outerIndex, []);
  for (let index = 0; index < rings.length; index += 1) {
    if (outerIndexes.includes(index)) continue;
    let container = outerIndexes[0];
    let smallestArea = Number.POSITIVE_INFINITY;
    for (const outerIndex of outerIndexes) {
      if (pointInRing(rings[index][0], rings[outerIndex])) {
        const area = Math.abs(signedArea(rings[outerIndex]));
        if (area < smallestArea) {
          smallestArea = area;
          container = outerIndex;
        }
      }
    }
    holeIndexes.get(container)?.push(index);
  }

  const polygons = outerIndexes.map((outerIndex) => [
    rings[outerIndex],
    ...(holeIndexes.get(outerIndex) ?? []).map((index) => rings[index]),
  ]);
  if (polygons.length === 1) return { type: 'Polygon', coordinates: polygons[0] };
  return { type: 'MultiPolygon', coordinates: polygons };
}

function parseShapeRecord(
  view: DataView,
  shapeType: number,
  transform: CoordinateTransform,
  sourceLayer: string,
): Record<string, unknown> | null {
  const family = shapeFamily(shapeType);
  if (family === 0) return null;
  if (family === -1) throw new Error(`Shapefile '${sourceLayer}' uses unsupported shape type ${shapeType}.`);

  const isZ = shapeType === 11 || shapeType === 13 || shapeType === 15 || shapeType === 18;
  const isM = shapeType === 21 || shapeType === 23 || shapeType === 25 || shapeType === 28;

  if (family === 1) {
    if (isZ) {
      if (view.byteLength < 28) throw readError(sourceLayer, 'record ended while reading the point Z ordinate');
      const z = readNumber(view, 20, true, sourceLayer);
      if (view.byteLength > 28) {
        if (view.byteLength < 36) throw readError(sourceLayer, 'record ended while reading the point measure');
        readNumber(view, 28, true, sourceLayer);
      }
      return { type: 'Point', coordinates: readPoint(view, 4, transform, sourceLayer, z) };
    }
    if (isM) {
      if (view.byteLength < 28) throw readError(sourceLayer, 'record ended while reading the point measure');
      readNumber(view, 20, true, sourceLayer);
    } else if (view.byteLength < 20) {
      throw readError(sourceLayer, 'record ended while reading point coordinates');
    }
    return { type: 'Point', coordinates: readPoint(view, 4, transform, sourceLayer) };
  }

  if (view.byteLength < 40) throw readError(sourceLayer, 'record header is too short');
  const numParts = family === 8 ? 0 : view.getInt32(36, true);
  const numPoints = view.getInt32(family === 8 ? 36 : 40, true);
  if (numPoints < 0 || numPoints > 10_000_000) throw readError(sourceLayer, 'record has an invalid point count');

  if (family === 8) {
    const baseLength = 40 + numPoints * 16;
    if (numPoints <= 0 || baseLength > view.byteLength) throw readError(sourceLayer, 'record ended while reading multipoint coordinates');
    let zValues: number[] | undefined;
    if (isZ) {
      const zSectionLength = 16 + numPoints * 8;
      zValues = readMeasureSection(view, baseLength, numPoints, sourceLayer);
      if (view.byteLength > baseLength + zSectionLength) {
        readMeasureSection(view, baseLength + zSectionLength, numPoints, sourceLayer);
      }
    } else if (isM) {
      readMeasureSection(view, baseLength, numPoints, sourceLayer);
    }
    const coordinates: number[][] = [];
    for (let index = 0; index < numPoints; index += 1) {
      coordinates.push(readPoint(view, 40 + index * 16, transform, sourceLayer, zValues?.[index]));
    }
    return { type: 'MultiPoint', coordinates };
  }

  const baseLength = 44 + numParts * 4 + numPoints * 16;
  if (baseLength > view.byteLength) throw readError(sourceLayer, 'record ended while reading shape coordinates');
  let zValues: number[] | undefined;
  if (isZ) {
    const zSectionLength = 16 + numPoints * 8;
    zValues = readMeasureSection(view, baseLength, numPoints, sourceLayer);
    if (view.byteLength > baseLength + zSectionLength) {
      readMeasureSection(view, baseLength + zSectionLength, numPoints, sourceLayer);
    }
  } else if (isM) {
    readMeasureSection(view, baseLength, numPoints, sourceLayer);
  }
  const parts = readParts(view, 44, numParts, numPoints, transform, sourceLayer, zValues);
  return family === 3
    ? (parts.length === 1 ? { type: 'LineString', coordinates: parts[0] } : { type: 'MultiLineString', coordinates: parts })
    : polygonGeometry(parts);
}

function parseShp(data: Uint8Array, sourceLayer: string, transform: CoordinateTransform, maxFeatures: number): ShapefileData {
  if (data.byteLength < 100) throw readError(sourceLayer, 'file header is too short');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (view.getInt32(0, false) !== 9994 || view.getInt32(28, true) !== 1000) {
    throw readError(sourceLayer, 'invalid file code or version');
  }
  const declaredLength = view.getInt32(24, false) * 2;
  if (declaredLength < 100 || declaredLength > data.byteLength) throw readError(sourceLayer, 'invalid file length');
  const shapeType = view.getInt32(32, true);
  if (!SUPPORTED_SHAPE_TYPES[shapeType]) throw new Error(`Shapefile '${sourceLayer}' uses unsupported shape type ${shapeType}.`);
  const expectedFamily = shapeFamily(shapeType);
  const records: ShapefileRecord[] = [];
  let offset = 100;
  while (offset < declaredLength) {
    if (offset + 8 > declaredLength) throw readError(sourceLayer, 'record header is truncated');
    const contentLength = view.getInt32(offset + 4, false) * 2;
    if (contentLength < 4 || offset + 8 + contentLength > declaredLength) throw readError(sourceLayer, 'record content is truncated');
    const recordView = new DataView(data.buffer, data.byteOffset + offset + 8, contentLength);
    const recordType = recordView.getInt32(0, true);
    if (recordType !== 0 && shapeFamily(recordType) !== expectedFamily) {
      throw readError(sourceLayer, `record shape type ${recordType} does not match the file shape type`);
    }
    records.push({ geometry: parseShapeRecord(recordView, recordType, transform, sourceLayer) });
    assertFeatureLimit(records.length, maxFeatures);
    offset += 8 + contentLength;
  }
  return { records };
}

function decodeText(bytes: Uint8Array, decoder: TextDecoder): string {
  return decoder.decode(bytes).replace(/\0/g, '').trim();
}

function createDbfDecoder(cpg: Uint8Array | undefined, sourceLayer: string): TextDecoder {
  if (!cpg) return new TextDecoder('utf-8');
  const label = new TextDecoder('utf-8').decode(cpg).replace(/\0/g, '').trim();
  const normalized = label.toLowerCase().replace(/[\s_]+/g, '-');
  let encoding: string;
  if (normalized === 'utf-8' || normalized === 'utf8' || normalized === '65001') {
    encoding = 'utf-8';
  } else if (
    normalized === 'windows-1252'
    || normalized === 'cp1252'
    || normalized === 'cp-1252'
    || normalized === '1252'
  ) {
    encoding = 'windows-1252';
  } else if (
    normalized === 'iso-8859-1'
    || normalized === 'iso8859-1'
    || normalized === '8859-1'
    || normalized === 'latin-1'
    || normalized === 'latin1'
  ) {
    encoding = 'iso-8859-1';
  } else {
    throw new Error(`Shapefile '${sourceLayer}' uses unsupported DBF .cpg encoding '${label}'. Supported encodings: UTF-8, Windows-1252/CP1252, ISO-8859-1/Latin-1.`);
  }
  return new TextDecoder(encoding);
}

function parseDbfValue(bytes: Uint8Array, field: DbfField, decoder: TextDecoder): unknown {
  const text = decodeText(bytes, decoder);
  if (text.length === 0) return null;
  switch (field.type.toUpperCase()) {
    case 'N':
    case 'F':
    case 'O': {
      const value = Number(text);
      return Number.isFinite(value) ? value : text;
    }
    case 'L': {
      const value = text.toUpperCase();
      return value === 'Y' || value === 'T' ? true : value === 'N' || value === 'F' ? false : null;
    }
    default:
      return text;
  }
}


function parseDbf(
  data: Uint8Array,
  sourceLayer: string,
  maxFeatures: number,
  decoder: TextDecoder,
): Array<Record<string, unknown> | null> {
  if (data.byteLength < 33) throw readError(sourceLayer, 'DBF header is too short');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const recordCount = view.getUint32(4, true);
  const headerLength = view.getUint16(8, true);
  const recordLength = view.getUint16(10, true);
  if (headerLength < 33 || headerLength > data.byteLength || recordLength < 1) throw readError(sourceLayer, 'DBF header has invalid lengths');
  assertFeatureLimit(recordCount, maxFeatures);

  const fields: DbfField[] = [];
  let offset = 32;
  while (offset < headerLength) {
    const marker = data[offset];
    if (marker === 0x0d) break;
    if (offset + 32 > headerLength) throw readError(sourceLayer, 'DBF field descriptor is truncated');
    fields.push({
      name: decodeText(data.slice(offset, offset + 11), decoder),
      type: String.fromCharCode(data[offset + 11]),
      length: data[offset + 16],
    });
    offset += 32;
  }
  if (offset >= headerLength && data[headerLength - 1] !== 0x0d) throw readError(sourceLayer, 'DBF field descriptor terminator is missing');

  const rows: Array<Record<string, unknown> | null> = [];
  for (let row = 0; row < recordCount; row += 1) {
    const rowOffset = headerLength + row * recordLength;
    if (rowOffset + recordLength > data.byteLength) throw readError(sourceLayer, 'DBF record data is truncated');
    const deleted = data[rowOffset] === 0x2a;
    if (deleted) {
      rows.push(null);
      continue;
    }
    const properties: Record<string, unknown> = {};
    let fieldOffset = rowOffset + 1;
    for (const field of fields) {
      if (fieldOffset + field.length > rowOffset + recordLength) throw readError(sourceLayer, 'DBF field exceeds record length');
      properties[field.name] = parseDbfValue(data.slice(fieldOffset, fieldOffset + field.length), field, decoder);
      fieldOffset += field.length;
    }
    rows.push(properties);
  }
  return rows;
}

export function parseShapefileZip(
  buffer: ArrayBuffer | Uint8Array,
  sourceLayer: string | undefined,
  maxFeatures: number,
): RawVectorFeatureCollection {
  if (!Number.isSafeInteger(maxFeatures) || maxFeatures <= 0) throw new Error('maxFeatures must be a positive integer.');
  const entries = unzipSync(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer));
  const layerNames = Object.keys(entries)
    .filter((name) => name.toLowerCase().endsWith('.shp'))
    .map((name) => name.slice(0, -4));
  const selectedLayer = selectSourceLayer(layerNames, sourceLayer);
  const shp = findZipEntry(entries, `${selectedLayer}.shp`);
  const dbf = findZipEntry(entries, `${selectedLayer}.dbf`);
  const prj = findZipEntry(entries, `${selectedLayer}.prj`);
  const cpg = findZipEntry(entries, `${selectedLayer}.cpg`);
  if (!shp) throw new Error(`Shapefile '${selectedLayer}' is missing a .shp file.`);
  if (!dbf) throw new Error(`Shapefile '${selectedLayer}' is missing a matching .dbf file.`);
  const isWebMercator = assertShapefileCrs(prj, selectedLayer);
  const transform: CoordinateTransform = isWebMercator ? mercatorToWgs84 : (x, y) => [x, y];
  const shapefile = parseShp(shp, selectedLayer, transform, maxFeatures);
  const properties = parseDbf(dbf, selectedLayer, maxFeatures, createDbfDecoder(cpg, selectedLayer));
  if (properties.length !== shapefile.records.length) {
    throw new Error(`Shapefile '${selectedLayer}' has ${shapefile.records.length} SHP records but ${properties.length} DBF records.`);
  }
  return {
    type: 'FeatureCollection',
    features: shapefile.records.flatMap((record, index) => {
      const row = properties[index];
      return row === null ? [] : [{
        type: 'Feature',
        geometry: record.geometry,
        properties: row,
      }];
    }),
  };
}

