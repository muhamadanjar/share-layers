import type { FileMetadata } from './types';

export function renderTemplate(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    key in values ? String(values[key]) : ''
  );
}

export function renderFeatureProperties(
  feature: Record<string, unknown>,
  metadata?: FileMetadata
): { mode: string; fields: Array<{ key: string; label: string; value: string }> } {
  const mode = metadata?.renderMode ?? 'original';

  if (mode === 'fields' && metadata?.fields) {
    const fields = metadata.fields
      .filter((f) => f.visible)
      .map((f) => ({
        key: f.original,
        label: f.label,
        value: String(feature[f.original] ?? ''),
      }));
    return { mode: 'fields', fields };
  }

  if (mode === 'custom' && metadata?.custom) {
    const html = renderTemplate(metadata.custom, feature);
    return {
      mode: 'custom',
      fields: [{ key: '_custom', label: '_custom', value: html }],
    };
  }

  // original: all properties
  const fields = Object.entries(feature).map(([key, value]) => ({
    key,
    label: key,
    value: String(value ?? ''),
  }));
  return { mode: 'original', fields };
}
