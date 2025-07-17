import { DATE_FORMATS, DateFormatEnum } from "@/schema/dateSchema";
import {
    DEFAULT_INVOICE_FIELDS,
    EXPORT_CONSTANTS,
    FIELD_MAPPING,
    type ExportField,
    type ExportFilters,
    type ExportFormat,
    type ExportJob,
    type ExportJobStatus,
    type ExportOptions,
    type ExportTemplate,
} from "@/schema/exportSchema";
import {
    FINANCIAL_CONSTANTS,
    SupportedCurrencyEnum,
} from "@/schema/financialSchema";
import { DISPLAY_MESSAGES, ERROR_MESSAGES } from "@/schema/messageSchema";
import { formatDisplay, formatFileISOString } from "@/utils/core/date";
import {
    camelCaseToReadable,
    formatCurrency,
    formatNumber,
} from "@/utils/core/format";

/**
 * Export utility functions
 * Handles data export to various formats (Excel, CSV), field mapping, and file generation
 */

// Generate export options
export const createExportOptions = (
    format: ExportFormat,
    fields?: ExportField[],
    filters?: ExportFilters,
    customOptions?: Partial<ExportOptions>,
): ExportOptions => ({
    format,
    includeHeaders: true,
    dateFormat: DATE_FORMATS.DISPLAY,
    currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
    fields: fields || DEFAULT_INVOICE_FIELDS.filter((f) => f.included),
    filters,
    ...customOptions,
});

// Filter data based on export filters
export const filterData = <T extends Record<string, unknown>>(
    data: T[],
    filters?: ExportFilters,
): T[] => {
    if (!filters) return data;
    return data.filter((item) => {
        // Date range filter
        if (filters.dateRange) {
            const itemDate = new Date(item.invoiceDate as string);
            if (
                itemDate < filters.dateRange.from ||
                itemDate > filters.dateRange.to
            ) {
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
            if (
                amount < filters.amountRange.min ||
                amount > filters.amountRange.max
            ) {
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
            const itemTags = (item.tags as string[]) || [];
            if (!filters.tags.some((tag) => itemTags.includes(tag))) {
                return false;
            }
        }
        return true;
    });
};

// Transform data for export
export const transformDataForExport = <T extends Record<string, unknown>>(
    data: T[],
    fields: ExportField[],
    options: ExportOptions,
): Record<string, unknown>[] => {
    const includedFields = fields.filter((field) => field.included);

    return data.map((item) => {
        const transformedItem: Record<string, unknown> = {};

        includedFields.forEach((field) => {
            const mapping = FIELD_MAPPING[field.key];
            let value = item[field.key];

            // Apply transformation if available
            if (mapping?.transform) {
                value = mapping.transform(value);
            } else {
                // Apply default formatting based on type
                value = formatValueByType(value, field.type, options);
            }

            transformedItem[field.label] = value;
        });

        return transformedItem;
    });
};

// Format value based on type
export const formatValueByType = (
    value: unknown,
    type: ExportField["type"],
    options: ExportOptions,
): unknown => {
    if (value === null || value === undefined) return "";
    switch (type) {
        case "DATE":
            return value instanceof Date || typeof value === "string"
                ? formatDisplay(new Date(value))
                : value;
        case "CURRENCY":
            return typeof value === "number"
                ? formatCurrency(value, options.currency)
                : value;
        case "NUMBER":
            return typeof value === "number" ? formatNumber(value) : value;
        case "BOOLEAN":
            return value ? DISPLAY_MESSAGES.YES : DISPLAY_MESSAGES.NO;
        case "TEXT":
        default:
            return String(value);
    }
};

// Generate filename
export const generateFilename = (
    format: ExportFormat,
    timestamp?: Date,
): string => {
    const date = timestamp || new Date();
    const dateStr = formatFileISOString(date);
    const extension =
        EXPORT_CONSTANTS.EXPORT_FORMATS[format] || format.toLowerCase();
    return EXPORT_CONSTANTS.EXPORT_FILE_NAME.replace(
        "{dateString}",
        dateStr,
    ).replace("{format}", extension);
};

// Create CSV content
export const createCSVContent = (
    data: Record<string, unknown>[],
    options: ExportOptions,
): string => {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add headers if required
    if (options.includeHeaders) {
        csvRows.push(escapeCSVRow(headers));
    }

    // Add data rows
    data.forEach((row) => {
        const values = headers.map((header) => String(row[header] || ""));
        csvRows.push(escapeCSVRow(values));
    });

    return csvRows.join("\n");
};

// Escape CSV row
export const escapeCSVRow = (values: string[]): string =>
    values
        .map((value) => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (
                value.includes(",") ||
                value.includes('"') ||
                value.includes("\n")
            ) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        })
        .join(",");

// Validate export options
export const validateExportOptions = (
    options: ExportOptions,
): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];
    // Check format
    if (
        !Object.values(EXPORT_CONSTANTS.EXPORT_FORMATS).includes(
            options.format.toLowerCase() as never,
        )
    ) {
        errors.push(ERROR_MESSAGES.INVALID_EXPORT_FORMAT);
    }
    // Check fields
    if (!options.fields || options.fields.length === 0) {
        errors.push(ERROR_MESSAGES.NO_FIELDS_SELECTED);
    }
    // Check included fields
    const includedFields = options.fields.filter((f) => f.included);
    if (includedFields.length === 0) {
        errors.push(ERROR_MESSAGES.NO_FIELDS_SELECTED);
    }
    // Check date format
    if (!DateFormatEnum.includes(options.dateFormat)) {
        errors.push(ERROR_MESSAGES.INVALID_DATE);
    }
    // Check currency
    if (
        !(SupportedCurrencyEnum as readonly string[]).includes(options.currency)
    ) {
        errors.push(ERROR_MESSAGES.INVALID_CURRENCY);
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Create export job
export const createExportJob = (
    userId: string,
    options: ExportOptions,
    recordCount: number,
): Omit<ExportJob, "id" | "createdAt" | "expiresAt"> => {
    const fileName = generateFilename(options.format, new Date());
    return {
        userId,
        format: options.format,
        status: "PENDING",
        fileName,
        recordCount,
        options,
    };
};

// Calculate export progress
export const calculateProgress = (
    processed: number,
    total: number,
): { progress: number; estimatedTimeRemaining?: number } => {
    const progress = Math.min(100, Math.round((processed / total) * 100));

    // Simple estimation based on processing rate
    let estimatedTimeRemaining: number | undefined;
    if (processed > 0 && progress < 100) {
        const avgTimePerRecord =
            EXPORT_CONSTANTS.PROCESSING_ESTIMATES.MS_PER_RECORD; // milliseconds per record (estimate)
        const remaining = total - processed;
        estimatedTimeRemaining = remaining * avgTimePerRecord;
    }

    return { progress, estimatedTimeRemaining };
};

// Get field suggestions based on data
export const suggestFields = <T extends Record<string, unknown>>(
    data: T[],
): readonly ExportField[] => {
    if (data.length === 0) return DEFAULT_INVOICE_FIELDS;
    const sampleRecord = data[0];
    const suggestions: ExportField[] = [];
    Object.keys(sampleRecord).forEach((key) => {
        const mapping = FIELD_MAPPING[key];
        if (mapping) {
            suggestions.push({
                key,
                label: mapping.label,
                type: mapping.type,
                format: mapping.format,
                included:
                    DEFAULT_INVOICE_FIELDS.find((f) => f.key === key)
                        ?.included || false,
            });
        } else {
            // Try to infer type from sample data
            const value = sampleRecord[key];
            let type: ExportField["type"] = "TEXT";
            if (typeof value === "number") type = "NUMBER";
            else if (typeof value === "boolean") type = "BOOLEAN";
            else if (
                value instanceof Date ||
                (typeof value === "string" && !isNaN(Date.parse(value)))
            )
                type = "DATE";
            suggestions.push({
                key,
                label: camelCaseToReadable(key),
                type,
                included: false,
            });
        }
    });
    return suggestions;
};

// Create export template
export const createExportTemplate = (
    name: string,
    description: string,
    options: ExportOptions,
    userId: string,
    isDefault: boolean = false,
): Omit<ExportTemplate, "id" | "createdAt" | "updatedAt"> => ({
    name,
    description,
    options,
    isDefault,
    userId,
});

// Merge export templates
export const mergeExportOptions = (
    baseOptions: ExportOptions,
    overrides: Partial<ExportOptions>,
): ExportOptions => ({
    ...baseOptions,
    ...overrides,
    fields: overrides.fields || baseOptions.fields,
    filters: overrides.filters
        ? {
              ...baseOptions.filters,
              ...overrides.filters,
          }
        : baseOptions.filters,
});

// Helper functions for common export operations
// Quick format checks
export const isExcelFormat = (format: ExportFormat) => format === "EXCEL";
export const isCSVFormat = (format: ExportFormat) => format === "CSV";

// Status helpers
export const isExportPending = (status: ExportJobStatus) =>
    status === "PENDING";
export const isExportProcessing = (status: ExportJobStatus) =>
    status === "PROCESSING";
export const isExportCompleted = (status: ExportJobStatus) =>
    status === "COMPLETED";
export const isExportFailed = (status: ExportJobStatus) => status === "FAILED";

// Field helpers
export const getRequiredFields = (fields: ExportField[]) =>
    fields.filter((f) => f.included);
export const getFieldByKey = (fields: ExportField[], key: string) =>
    fields.find((f) => f.key === key);

// Data helpers
export const getExportSummary = (data: Record<string, unknown>[]) => ({
    totalRecords: data.length,
    estimatedSize:
        data.length * EXPORT_CONSTANTS.PROCESSING_ESTIMATES.BYTES_PER_RECORD, // rough estimate in bytes
    fields: Object.keys(data[0] || {}),
});

// File helpers
export const getFileExtension = (format: ExportFormat) =>
    EXPORT_CONSTANTS.EXPORT_FORMATS[format] || format.toLowerCase();
export const getMimeType = (format: ExportFormat) => {
    switch (format) {
        case "EXCEL":
            return EXPORT_CONSTANTS.MIME_TYPES.EXCEL;
        default: //'CSV'
            return EXPORT_CONSTANTS.MIME_TYPES.CSV;
    }
};
