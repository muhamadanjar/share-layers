import { describe, it, expect } from 'vitest';
import { renderFeatureProperties, renderTemplate } from '../metadata-renderer';
import type { FileMetadata } from '../types';

describe('renderFeatureProperties', () => {
  it('renders original mode (all properties)', () => {
    const feature = { name: 'Test', value: 42 };
    const result = renderFeatureProperties(feature, { renderMode: 'original' });
    expect(result.mode).toBe('original');
    expect(result.fields.length).toBe(2);
  });

  it('renders fields mode (filtered + labeled)', () => {
    const feature = { id: '1', name: 'Test', hidden: 'secret' };
    const metadata: FileMetadata = {
      renderMode: 'fields',
      fields: [
        { original: 'id', label: 'ID', visible: true },
        { original: 'name', label: 'Name', visible: true },
        { original: 'hidden', label: 'Hidden', visible: false },
      ],
    };
    const result = renderFeatureProperties(feature, metadata);
    expect(result.mode).toBe('fields');
    expect(result.fields.length).toBe(2);
  });

  it('renders custom mode (template-based)', () => {
    const feature = { name: 'Alice', city: 'NYC' };
    const metadata: FileMetadata = {
      renderMode: 'custom',
      custom: '**{{name}}** lives in {{city}}',
    };
    const result = renderFeatureProperties(feature, metadata);
    expect(result.mode).toBe('custom');
    expect(result.fields[0].value).toContain('Alice');
  });

  it('renders template string with property substitution', () => {
    const template = 'Hello {{name}}, welcome to {{city}}';
    const values = { name: 'Alice', city: 'NYC' };
    const result = renderTemplate(template, values);
    expect(result).toBe('Hello Alice, welcome to NYC');
  });

  it('handles missing properties in template', () => {
    const template = 'Name: {{name}}, Age: {{age}}';
    const values = { name: 'Alice' };
    const result = renderTemplate(template, values);
    expect(result).toBe('Name: Alice, Age: ');
  });
});
