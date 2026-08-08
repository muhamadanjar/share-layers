import type { FileMetadata } from './types';
export declare function renderTemplate(template: string, values: Record<string, unknown>): string;
export declare function renderFeatureProperties(feature: Record<string, unknown>, metadata?: FileMetadata): {
    mode: string;
    fields: Array<{
        key: string;
        label: string;
        value: string;
    }>;
};
//# sourceMappingURL=metadata-renderer.d.ts.map