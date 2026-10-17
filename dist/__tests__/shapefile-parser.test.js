import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { parseShapefileZip } from '../shapefile-parser';
function writePointShape(shapeType, points) {
    const records = points.map((point, index) => {
        const [x, y] = point;
        const z = point.length === 3 ? point[2] : 7;
        const content = new ArrayBuffer(shapeType === 11 ? 36 : shapeType === 21 ? 28 : 20);
        const view = new DataView(content);
        view.setInt32(0, shapeType, true);
        view.setFloat64(4, x, true);
        view.setFloat64(12, y, true);
        if (shapeType === 11) {
            view.setFloat64(20, z, true);
            view.setFloat64(28, 0, true);
        }
        else if (shapeType === 21) {
            view.setFloat64(20, z, true);
        }
        return { index, content: new Uint8Array(content) };
    });
    return writeShapeFile(shapeType, records.map((record) => record.content));
}
function writePartsShape(shapeType, parts) {
    const pointCount = parts.reduce((count, part) => count + part.length, 0);
    const hasZ = shapeType === 13 || shapeType === 15;
    const hasM = shapeType === 23 || shapeType === 25;
    const coordinateLength = 4 + 32 + 4 + 4 + parts.length * 4 + pointCount * 16;
    const measureLength = hasZ ? 32 + pointCount * 16 : hasM ? 16 + pointCount * 8 : 0;
    const content = new ArrayBuffer(coordinateLength + measureLength);
    const view = new DataView(content);
    view.setInt32(0, shapeType, true);
    view.setInt32(36, parts.length, true);
    view.setInt32(40, pointCount, true);
    let pointIndex = 0;
    for (let index = 0; index < parts.length; index += 1) {
        view.setInt32(44 + index * 4, pointIndex, true);
        pointIndex += parts[index].length;
    }
    pointIndex = 0;
    for (const part of parts) {
        for (const point of part) {
            const [x, y] = point;
            const offset = 44 + parts.length * 4 + pointIndex * 16;
            view.setFloat64(offset, x, true);
            view.setFloat64(offset + 8, y, true);
            pointIndex += 1;
        }
    }
    if (hasZ || hasM) {
        const sectionOffset = coordinateLength;
        if (hasZ) {
            view.setFloat64(sectionOffset, 0, true);
            view.setFloat64(sectionOffset + 8, 100, true);
            pointIndex = 0;
            for (const part of parts) {
                for (const point of part) {
                    view.setFloat64(sectionOffset + 16 + pointIndex * 8, point.length === 3 ? point[2] : 7, true);
                    pointIndex += 1;
                }
            }
            view.setFloat64(sectionOffset + 16 + pointCount * 8, 0, true);
            view.setFloat64(sectionOffset + 24 + pointCount * 8, 0, true);
        }
        else {
            view.setFloat64(sectionOffset, 0, true);
            view.setFloat64(sectionOffset + 8, 100, true);
            pointIndex = 0;
            for (const part of parts) {
                for (const point of part) {
                    view.setFloat64(sectionOffset + 16 + pointIndex * 8, point.length === 3 ? point[2] : 0, true);
                    pointIndex += 1;
                }
            }
        }
    }
    return writeShapeFile(shapeType, [new Uint8Array(content)]);
}
function writeShapeFile(shapeType, contents) {
    const length = 100 + contents.reduce((sum, content) => sum + 8 + content.length, 0);
    const data = new ArrayBuffer(length);
    const view = new DataView(data);
    view.setInt32(0, 9994, false);
    view.setInt32(24, length / 2, false);
    view.setInt32(28, 1000, true);
    view.setInt32(32, shapeType, true);
    let offset = 100;
    contents.forEach((content, index) => {
        view.setInt32(offset, index + 1, false);
        view.setInt32(offset + 4, content.length / 2, false);
        new Uint8Array(data, offset + 8, content.length).set(content);
        offset += 8 + content.length;
    });
    return new Uint8Array(data);
}
function writeDbf(rows, fieldName = 'name', deletedIndexes = []) {
    const fieldLength = 20;
    const headerLength = 32 + 32 + 1;
    const recordLength = 1 + fieldLength;
    const data = new Uint8Array(headerLength + rows.length * recordLength);
    const view = new DataView(data.buffer);
    data[0] = 0x03;
    view.setUint32(4, rows.length, true);
    view.setUint16(8, headerLength, true);
    view.setUint16(10, recordLength, true);
    for (let index = 0; index < fieldName.length; index += 1)
        data[32 + index] = fieldName.charCodeAt(index);
    data[43] = 0x43;
    data[48] = fieldLength;
    data[64] = 0x0d;
    rows.forEach((row, index) => {
        const offset = headerLength + index * recordLength;
        data[offset] = deletedIndexes.includes(index) ? 0x2a : 0x20;
        const value = row[fieldName].padEnd(fieldLength, ' ');
        for (let character = 0; character < value.length; character += 1)
            data[offset + 1 + character] = value.charCodeAt(character);
    });
    return data;
}
function zipLayer(shp, dbf, prj = 'GEOGCS["WGS 84",AUTHORITY["EPSG","4326"]]', cpg) {
    const entries = {
        'places.shp': shp,
        'places.dbf': dbf,
        'places.prj': new TextEncoder().encode(prj),
    };
    if (cpg !== undefined)
        entries['places.cpg'] = new TextEncoder().encode(cpg);
    return zipSync(entries, { level: 0 });
}
describe('parseShapefileZip', () => {
    it('returns point features with DBF properties', () => {
        const data = parseShapefileZip(zipLayer(writePointShape(1, [[12.5, 41.9]]), writeDbf([{ name: 'Rome' }])), undefined, 10);
        expect(data).toEqual({
            type: 'FeatureCollection',
            features: [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [12.5, 41.9] },
                    properties: { name: 'Rome' },
                }],
        });
    });
    it('preserves PointZ ordinates', () => {
        const data = parseShapefileZip(zipLayer(writePointShape(11, [[12.5, 41.9, 123.75]]), writeDbf([{ name: 'Rome' }])), undefined, 10);
        expect(data.features[0].geometry).toEqual({
            type: 'Point',
            coordinates: [12.5, 41.9, 123.75],
        });
    });
    it('omits DBF records marked as deleted', () => {
        const data = parseShapefileZip(zipLayer(writePointShape(1, [[1, 1], [2, 2]]), writeDbf([{ name: 'deleted' }, { name: 'live' }], 'name', [0])), undefined, 10);
        expect(data.features).toEqual([{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [2, 2] },
                properties: { name: 'live' },
            }]);
    });
    it('decodes DBF field names and values using the CPG encoding', () => {
        const fieldName = 'caf\u00e9';
        const data = parseShapefileZip(zipLayer(writePointShape(1, [[12.5, 41.9]]), writeDbf([{ [fieldName]: 'Cr\u00e8me' }], fieldName), undefined, 'CP1252'), undefined, 10);
        expect(data.features[0].properties).toEqual({ [fieldName]: 'Cr\u00e8me' });
    });
    it('preserves multipart lines and polygon holes', () => {
        const lineData = parseShapefileZip(zipLayer(writePartsShape(3, [[[0, 0], [1, 1]], [[5, 5], [6, 6]]]), writeDbf([{ name: 'line' }])), undefined, 10);
        expect(lineData.features[0].geometry).toEqual({
            type: 'MultiLineString',
            coordinates: [[[0, 0], [1, 1]], [[5, 5], [6, 6]]],
        });
        const polygonData = parseShapefileZip(zipLayer(writePartsShape(5, [
            [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
            [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]],
        ]), writeDbf([{ name: 'polygon' }])), undefined, 10);
        expect(polygonData.features[0].geometry).toEqual({
            type: 'Polygon',
            coordinates: [
                [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
                [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]],
            ],
        });
    });
    it('converts EPSG:3857 coordinates to WGS84', () => {
        const data = parseShapefileZip(zipLayer(writePointShape(11, [[1113194.9079, 1118889.974]]), writeDbf([{ name: 'mercator' }]), 'PROJCS["WGS 84 / Pseudo-Mercator",AUTHORITY["EPSG","3857"]]'), undefined, 10);
        const geometry = data.features[0].geometry;
        if (!geometry || typeof geometry !== 'object' || !('coordinates' in geometry) || !Array.isArray(geometry.coordinates)) {
            throw new Error('Expected a point geometry.');
        }
        const coordinates = geometry.coordinates;
        if (coordinates.length !== 3 || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number' || typeof coordinates[2] !== 'number') {
            throw new Error('Expected numeric point coordinates.');
        }
        expect(coordinates[0]).toBeCloseTo(10, 5);
        expect(coordinates[1]).toBeCloseTo(10, 5);
        expect(coordinates[2]).toBe(7);
    });
    it('rejects non-zero first multipart indexes and geocentric WGS84 CRS', () => {
        const malformed = writePartsShape(3, [[[0, 0], [1, 1]], [[5, 5], [6, 6]]]);
        const malformedView = new DataView(malformed.buffer, malformed.byteOffset, malformed.byteLength);
        malformedView.setInt32(100 + 8 + 44, 1, true);
        expect(() => parseShapefileZip(zipLayer(malformed, writeDbf([{ name: 'line' }])), undefined, 10))
            .toThrow('invalid part indexes');
        const shp = writePointShape(1, [[0, 0]]);
        expect(() => parseShapefileZip(zipLayer(shp, writeDbf([{ name: 'one' }]), 'GEOCCS["WGS 84",AUTHORITY["EPSG","4978"]]'), undefined, 10)).toThrow('unsupported CRS');
    });
    it('rejects missing sidecars, unsupported CRS, and feature limits', () => {
        const shp = writePointShape(1, [[0, 0]]);
        const dbf = writeDbf([{ name: 'one' }]);
        expect(() => parseShapefileZip(zipSync({ 'places.shp': shp, 'places.prj': new TextEncoder().encode('WGS 84') }), undefined, 10)).toThrow('matching .dbf');
        expect(() => parseShapefileZip(zipLayer(shp, dbf, 'EPSG:32632'), undefined, 10)).toThrow('unsupported CRS');
        expect(() => parseShapefileZip(zipLayer(shp, dbf), undefined, 0)).toThrow('maxFeatures');
    });
});
//# sourceMappingURL=shapefile-parser.test.js.map