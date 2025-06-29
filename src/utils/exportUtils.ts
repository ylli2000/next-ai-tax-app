import {
    type ExportField,
    type ExportFieldMapping,
    type ExportFilters,
    type ExportFormat,
    type ExportJob,
    type ExportJobStatus,
    type ExportOptions,
    type ExportTemplate
} from '@/types/exportSchema';
import { CURRENCY_CONSTANTS, EXPORT_FORMATS } from './constants';
import { DateUtils } from './dateUtils';
import { FormatUtils } from './formatUtils';

/**
 * Export utility functions
 * Handles data export to various formats (Excel, CSV), field mapping, and file generation
 */
export class ExportUtils {
    // Default field mappings for invoice exports
    static readonly DEFAULT_INVOICE_FIELDS: ExportField[] = [
        { key: 'invoiceNumber', label: 'Invoice Number', type: 'TEXT', included: true },
        { key: 'supplierName', label: 'Supplier', type: 'TEXT', included: true },
        { key: 'invoiceDate', label: 'Invoice Date', type: 'DATE', included: true },
        { key: 'dueDate', label: 'Due Date', type: 'DATE', included: true },
        { key: 'subtotal', label: 'Subtotal', type: 'CURRENCY', included: true },
        { key: 'taxAmount', label: 'Tax Amount', type: 'CURRENCY', included: true },
        { key: 'totalAmount', label: 'Total Amount', type: 'CURRENCY', included: true },
        { key: 'currency', label: 'Currency', type: 'TEXT', included: true },
        { key: 'categoryName', label: 'Category', type: 'TEXT', included: true },
        { key: 'status', label: 'Status', type: 'TEXT', included: true },
        { key: 'supplierAddress', label: 'Supplier Address', type: 'TEXT', included: false },
        { key: 'supplierTaxId', label: 'Supplier Tax ID', type: 'TEXT', included: false },
        { key: 'taxRate', label: 'Tax Rate', type: 'NUMBER', included: false },
        { key: 'createdAt', label: 'Created Date', type: 'DATE', included: false },
        { key: 'updatedAt', label: 'Updated Date', type: 'DATE', included: false },
    ];

    // Field mapping for data transformation
    static readonly FIELD_MAPPING: ExportFieldMapping = {
        invoiceNumber: { label: 'Invoice Number', type: 'TEXT' },
        supplierName: { label: 'Supplier', type: 'TEXT' },
        supplierAddress: { label: 'Supplier Address', type: 'TEXT' },
        supplierTaxId: { label: 'Supplier Tax ID', type: 'TEXT' },
        invoiceDate: { 
            label: 'Invoice Date', 
            type: 'DATE',
            transform: (value) => value ? DateUtils.formatDisplay(new Date(value as string)) : ''
        },
        dueDate: { 
            label: 'Due Date', 
            type: 'DATE',
            transform: (value) => value ? DateUtils.formatDisplay(new Date(value as string)) : ''
        },
        subtotal: { 
            label: 'Subtotal', 
            type: 'CURRENCY',
            transform: (value) => FormatUtils.formatCurrency(value as number)
        },
        taxAmount: { 
            label: 'Tax Amount', 
            type: 'CURRENCY',
            transform: (value) => FormatUtils.formatCurrency(value as number)
        },
        totalAmount: { 
            label: 'Total Amount', 
            type: 'CURRENCY',
            transform: (value) => FormatUtils.formatCurrency(value as number)
        },
        taxRate: { 
            label: 'Tax Rate', 
            type: 'NUMBER',
            format: '0.00%',
            transform: (value) => FormatUtils.formatPercentage(value as number)
        },
        currency: { label: 'Currency', type: 'TEXT' },
        categoryName: { label: 'Category', type: 'TEXT' },
        status: { label: 'Status', type: 'TEXT' },
        createdAt: { 
            label: 'Created Date', 
            type: 'DATE',
            transform: (value) => DateUtils.formatDisplay(new Date(value as string))
        },
        updatedAt: { 
            label: 'Updated Date', 
            type: 'DATE',
            transform: (value) => DateUtils.formatDisplay(new Date(value as string))
        },
    };

    // Generate export options
    static createExportOptions(
        format: ExportFormat,
        fields?: ExportField[],
        filters?: ExportFilters,
        customOptions?: Partial<ExportOptions>
    ): ExportOptions {
        return {
            format,
            includeHeaders: true,
            dateFormat: 'DD/MM/YYYY',
            currency: CURRENCY_CONSTANTS.DEFAULT_CURRENCY,
            fields: fields || this.DEFAULT_INVOICE_FIELDS.filter(f => f.included),
            filters,
            ...customOptions,
        };
    }

    // Filter data based on export filters
    static filterData<T extends Record<string, unknown>>(
        data: T[],
        filters?: ExportFilters
    ): T[] {
        if (!filters) return data;

        return data.filter(item => {
            // Date range filter
            if (filters.dateRange) {
                const itemDate = new Date(item.invoiceDate as string);
                if (itemDate < filters.dateRange.from || itemDate > filters.dateRange.to) {
                    return false;
                }
            }

            // Categories filter
            if (filters.categories && filters.categories.length > 0) {
                if (!filters.categories.includes(item.categoryName as string)) {
                    return false;
                }
            }

            // Suppliers filter
            if (filters.suppliers && filters.suppliers.length > 0) {
                if (!filters.suppliers.includes(item.supplierName as string)) {
                    return false;
                }
            }

            // Amount range filter
            if (filters.amountRange) {
                const amount = item.totalAmount as number;
                if (amount < filters.amountRange.min || amount > filters.amountRange.max) {
                    return false;
                }
            }

            // Status filter
            if (filters.status && filters.status.length > 0) {
                if (!filters.status.includes(item.status as string)) {
                    return false;
                }
            }

            // Tags filter (if implemented)
            if (filters.tags && filters.tags.length > 0) {
                const itemTags = item.tags as string[] || [];
                if (!filters.tags.some(tag => itemTags.includes(tag))) {
                    return false;
                }
            }

            return true;
        });
    }

    // Transform data for export
    static transformDataForExport<T extends Record<string, unknown>>(
        data: T[],
        fields: ExportField[],
        options: ExportOptions
    ): Record<string, unknown>[] {
        const includedFields = fields.filter(field => field.included);

        return data.map(item => {
            const transformedItem: Record<string, unknown> = {};

            includedFields.forEach(field => {
                const mapping = this.FIELD_MAPPING[field.key];
                let value = item[field.key];

                // Apply transformation if available
                if (mapping?.transform) {
                    value = mapping.transform(value);
                } else {
                    // Apply default formatting based on type
                    value = this.formatValueByType(value, field.type, options);
                }

                transformedItem[field.label] = value;
            });

            return transformedItem;
        });
    }

    // Format value based on type
    static formatValueByType(
        value: unknown,
        type: ExportField['type'],
        options: ExportOptions
    ): unknown {
        if (value === null || value === undefined) return '';

        switch (type) {
            case 'DATE':
                if (value instanceof Date || typeof value === 'string') {
                    return DateUtils.formatDisplay(new Date(value));
                }
                return value;

            case 'CURRENCY':
                if (typeof value === 'number') {
                    return FormatUtils.formatCurrency(value, options.currency);
                }
                return value;

            case 'NUMBER':
                if (typeof value === 'number') {
                    return FormatUtils.formatNumber(value);
                }
                return value;

            case 'BOOLEAN':
                return value ? 'Yes' : 'No';

            case 'TEXT':
            default:
                return String(value);
        }
    }

    // Generate filename
    static generateFilename(
        prefix: string = 'export',
        format: ExportFormat,
        timestamp?: Date
    ): string {
        const date = timestamp || new Date();
        const dateStr = DateUtils.formatFileISOString(date);
        const extension = EXPORT_FORMATS[format] || format.toLowerCase();
        
        return `${prefix}_${dateStr}.${extension}`;
    }

    // Create CSV content
    static createCSVContent(
        data: Record<string, unknown>[],
        options: ExportOptions
    ): string {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows: string[] = [];

        // Add headers if required
        if (options.includeHeaders) {
            csvRows.push(this.escapeCSVRow(headers));
        }

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => String(row[header] || ''));
            csvRows.push(this.escapeCSVRow(values));
        });

        return csvRows.join('\n');
    }

    // Escape CSV row
    static escapeCSVRow(values: string[]): string {
        return values
            .map(value => {
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            })
            .join(',');
    }

    // Validate export options
    static validateExportOptions(options: ExportOptions): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Check format
        if (!Object.values(EXPORT_FORMATS).includes(options.format.toLowerCase() as never)) {
            errors.push('Invalid export format');
        }

        // Check fields
        if (!options.fields || options.fields.length === 0) {
            errors.push('At least one field must be selected for export');
        }

        // Check included fields
        const includedFields = options.fields.filter(f => f.included);
        if (includedFields.length === 0) {
            errors.push('At least one field must be included in export');
        }

        // Check date format
        const validDateFormats = ['ISO', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
        if (!validDateFormats.includes(options.dateFormat)) {
            errors.push('Invalid date format');
        }

        // Check currency
        if (!(CURRENCY_CONSTANTS.SUPPORTED_CURRENCIES as readonly string[]).includes(options.currency)) {
            errors.push('Unsupported currency');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Create export job
    static createExportJob(
        userId: string,
        options: ExportOptions,
        recordCount: number
    ): Omit<ExportJob, 'id' | 'createdAt' | 'expiresAt'> {
        const fileName = this.generateFilename(
            'invoices',
            options.format,
            new Date()
        );

        return {
            userId,
            format: options.format,
            status: 'PENDING',
            fileName,
            recordCount,
            options,
        };
    }

    // Calculate export progress
    static calculateProgress(
        processed: number,
        total: number
    ): { progress: number; estimatedTimeRemaining?: number } {
        const progress = Math.min(100, Math.round((processed / total) * 100));
        
        // Simple estimation based on processing rate
        let estimatedTimeRemaining: number | undefined;
        if (processed > 0 && progress < 100) {
            const avgTimePerRecord = 100; // milliseconds per record (estimate)
            const remaining = total - processed;
            estimatedTimeRemaining = remaining * avgTimePerRecord;
        }

        return { progress, estimatedTimeRemaining };
    }

    // Get field suggestions based on data
    static suggestFields<T extends Record<string, unknown>>(
        data: T[]
    ): ExportField[] {
        if (data.length === 0) return this.DEFAULT_INVOICE_FIELDS;

        const sampleRecord = data[0];
        const suggestions: ExportField[] = [];

        Object.keys(sampleRecord).forEach(key => {
            const mapping = this.FIELD_MAPPING[key];
            if (mapping) {
                suggestions.push({
                    key,
                    label: mapping.label,
                    type: mapping.type,
                    format: mapping.format,
                    included: this.DEFAULT_INVOICE_FIELDS.find(f => f.key === key)?.included || false,
                });
            } else {
                // Try to infer type from sample data
                const value = sampleRecord[key];
                let type: ExportField['type'] = 'TEXT';

                if (typeof value === 'number') {
                    type = 'NUMBER';
                } else if (typeof value === 'boolean') {
                    type = 'BOOLEAN';
                } else if (value instanceof Date || 
                          (typeof value === 'string' && !isNaN(Date.parse(value)))) {
                    type = 'DATE';
                }

                suggestions.push({
                    key,
                    label: FormatUtils.camelCaseToReadable(key),
                    type,
                    included: false,
                });
            }
        });

        return suggestions;
    }

    // Create export template
    static createExportTemplate(
        name: string,
        description: string,
        options: ExportOptions,
        userId: string,
        isDefault: boolean = false
    ): Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            name,
            description,
            options,
            isDefault,
            userId,
        };
    }

    // Merge export templates
    static mergeExportOptions(
        baseOptions: ExportOptions,
        overrides: Partial<ExportOptions>
    ): ExportOptions {
        return {
            ...baseOptions,
            ...overrides,
            fields: overrides.fields || baseOptions.fields,
            filters: overrides.filters ? {
                ...baseOptions.filters,
                ...overrides.filters,
            } : baseOptions.filters,
        };
    }
}

// Helper functions for common export operations
export const exportHelpers = {
    // Quick format checks
    isExcelFormat: (format: ExportFormat) => format === 'EXCEL',
    isCSVFormat: (format: ExportFormat) => format === 'CSV',
    
    // Status helpers
    isExportPending: (status: ExportJobStatus) => status === 'PENDING',
    isExportProcessing: (status: ExportJobStatus) => status === 'PROCESSING',
    isExportCompleted: (status: ExportJobStatus) => status === 'COMPLETED',
    isExportFailed: (status: ExportJobStatus) => status === 'FAILED',
    
    // Field helpers
    getRequiredFields: (fields: ExportField[]) => fields.filter(f => f.included),
    getFieldByKey: (fields: ExportField[], key: string) => fields.find(f => f.key === key),
    
    // Data helpers
    getExportSummary: (data: Record<string, unknown>[]) => ({
        totalRecords: data.length,
        estimatedSize: data.length * 100, // rough estimate in bytes
        fields: Object.keys(data[0] || {}),
    }),
    
    // File helpers
    getFileExtension: (format: ExportFormat) => EXPORT_FORMATS[format] || format.toLowerCase(),
    getMimeType: (format: ExportFormat) => {
        switch (format) {
            case 'EXCEL':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'CSV':
                return 'text/csv';
            default:
                return 'application/octet-stream';
        }
    },
};

export default ExportUtils; 