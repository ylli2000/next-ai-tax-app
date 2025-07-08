import { z } from "zod";
import { formatDisplay } from "../utils/dateUtils";
import { formatCurrency, formatPercentage } from "../utils/formatUtils";
import { dateFormatSchema } from "./dateSchema";

export const ExportFormatEnum = ["EXCEL", "CSV"] as const;
export const exportFormatSchema = z.enum(ExportFormatEnum);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

export const ExportFieldTypeEnum = [
    "TEXT",
    "NUMBER",
    "DATE",
    "CURRENCY",
    "BOOLEAN",
] as const;
export const exportFieldTypeSchema = z.enum(ExportFieldTypeEnum);
export type ExportFieldType = z.infer<typeof exportFieldTypeSchema>;

export const ExportJobStatusEnum = [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "EXPIRED",
] as const;
export const exportJobStatusSchema = z.enum(ExportJobStatusEnum);
export type ExportJobStatus = z.infer<typeof exportJobStatusSchema>;

// Export Field Schema
export const exportFieldSchema = z.object({
    key: z.string(),
    label: z.string(),
    type: exportFieldTypeSchema,
    format: z.string().optional(),
    included: z.boolean(),
});
export type ExportField = z.infer<typeof exportFieldSchema>;

// Export Filters Schema
export const exportFiltersSchema = z.object({
    dateRange: z
        .object({
            from: z.date(),
            to: z.date(),
        })
        .optional(),
    categories: z.array(z.string()).optional(),
    suppliers: z.array(z.string()).optional(),
    amountRange: z
        .object({
            min: z.number(),
            max: z.number(),
        })
        .optional(),
    status: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
});
export type ExportFilters = z.infer<typeof exportFiltersSchema>;

// Export processing constants for exportUtils.ts
export const EXPORT_CONSTANTS = {
    EXPORT_FILE_NAME: "export_{dateString}.{format}",
    PROCESSING_ESTIMATES: {
        MS_PER_RECORD: 100, // Used in exportUtils.ts for processing time estimation (milliseconds per record)
        BYTES_PER_RECORD: 100, // Used in exportUtils.ts for file size estimation (bytes per record)
    },
    MIME_TYPES: {
        EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Used in exportUtils.ts for Excel MIME type
        CSV: "text/csv", // Used in exportUtils.ts for CSV MIME type
        //DEFAULT: 'application/octet-stream', // Used in exportUtils.ts for unknown format fallback
    },
    // Export formats
    EXPORT_FORMATS: {
        EXCEL: "xlsx", // Used in exportUtils.ts and export API for Excel file generation
        CSV: "csv", // Used in exportUtils.ts and export API for CSV file generation
    },
} as const;

// Default field mappings for invoice exports
export const DEFAULT_INVOICE_FIELDS: readonly ExportField[] = [
    {
        key: "invoiceNumber",
        label: "Invoice Number",
        type: "TEXT",
        included: true,
    },
    { key: "supplierName", label: "Supplier", type: "TEXT", included: true },
    { key: "invoiceDate", label: "Invoice Date", type: "DATE", included: true },
    { key: "dueDate", label: "Due Date", type: "DATE", included: true },
    { key: "subtotal", label: "Subtotal", type: "CURRENCY", included: true },
    { key: "taxAmount", label: "Tax Amount", type: "CURRENCY", included: true },
    {
        key: "totalAmount",
        label: "Total Amount",
        type: "CURRENCY",
        included: true,
    },
    { key: "currency", label: "Currency", type: "TEXT", included: true },
    { key: "categoryName", label: "Category", type: "TEXT", included: true },
    { key: "status", label: "Status", type: "TEXT", included: true },
    {
        key: "supplierAddress",
        label: "Supplier Address",
        type: "TEXT",
        included: false,
    },
    {
        key: "supplierTaxId",
        label: "Supplier Tax ID",
        type: "TEXT",
        included: false,
    },
    { key: "taxRate", label: "Tax Rate", type: "NUMBER", included: false },
    { key: "createdAt", label: "Created Date", type: "DATE", included: false },
    { key: "updatedAt", label: "Updated Date", type: "DATE", included: false },
] as const;

// Field mapping for data transformation
export const FIELD_MAPPING: ExportFieldMapping = {
    invoiceNumber: { label: "Invoice Number", type: "TEXT" },
    supplierName: { label: "Supplier", type: "TEXT" },
    supplierAddress: { label: "Supplier Address", type: "TEXT" },
    supplierTaxId: { label: "Supplier Tax ID", type: "TEXT" },
    invoiceDate: {
        label: "Invoice Date",
        type: "DATE",
        transform: (value) =>
            value ? formatDisplay(new Date(value as string)) : "",
    },
    dueDate: {
        label: "Due Date",
        type: "DATE",
        transform: (value) =>
            value ? formatDisplay(new Date(value as string)) : "",
    },
    subtotal: {
        label: "Subtotal",
        type: "CURRENCY",
        transform: (value) => formatCurrency(value as number),
    },
    taxAmount: {
        label: "Tax Amount",
        type: "CURRENCY",
        transform: (value) => formatCurrency(value as number),
    },
    totalAmount: {
        label: "Total Amount",
        type: "CURRENCY",
        transform: (value) => formatCurrency(value as number),
    },
    taxRate: {
        label: "Tax Rate",
        type: "NUMBER",
        format: "0.00%",
        transform: (value) => formatPercentage(value as number),
    },
    currency: { label: "Currency", type: "TEXT" },
    categoryName: { label: "Category", type: "TEXT" },
    status: { label: "Status", type: "TEXT" },
    createdAt: {
        label: "Created Date",
        type: "DATE",
        transform: (value) => formatDisplay(new Date(value as string)),
    },
    updatedAt: {
        label: "Updated Date",
        type: "DATE",
        transform: (value) => formatDisplay(new Date(value as string)),
    },
} as const;

// Export Options Schema
export const exportOptionsSchema = z.object({
    format: exportFormatSchema,
    includeHeaders: z.boolean(),
    dateFormat: dateFormatSchema,
    currency: z.string(),
    filename: z.string().optional(),
    fields: z.array(exportFieldSchema),
    filters: exportFiltersSchema.optional(),
});
export type ExportOptions = z.infer<typeof exportOptionsSchema>;

// Export Job Schema
export const exportJobSchema = z.object({
    id: z.string(),
    userId: z.string(),
    format: exportFormatSchema,
    status: exportJobStatusSchema,
    fileName: z.string(),
    fileSize: z.number().optional(),
    downloadUrl: z.string().optional(),
    recordCount: z.number().optional(),
    options: exportOptionsSchema,
    error: z.string().optional(),
    createdAt: z.date(),
    completedAt: z.date().optional(),
    expiresAt: z.date(),
});
export type ExportJob = z.infer<typeof exportJobSchema>;

// Export Progress Schema
export const exportProgressSchema = z.object({
    jobId: z.string(),
    status: exportJobStatusSchema,
    progress: z.number().min(0).max(100),
    message: z.string().optional(),
    estimatedTimeRemaining: z.number().optional(),
});
export type ExportProgress = z.infer<typeof exportProgressSchema>;

// Export Template Schema
export const exportTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    options: exportOptionsSchema,
    isDefault: z.boolean(),
    userId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export type ExportTemplate = z.infer<typeof exportTemplateSchema>;

// Create Export Job Request Schema
export const createExportJobRequestSchema = z.object({
    options: exportOptionsSchema,
    templateId: z.string().optional(),
});
export type CreateExportJobRequest = z.infer<
    typeof createExportJobRequestSchema
>;

// Export Field Mapping Schema
export const exportFieldMappingItemSchema = z.object({
    label: z.string(),
    type: exportFieldTypeSchema,
    format: z.string().optional(),
    transform: z.function().args(z.unknown()).returns(z.unknown()).optional(),
});

export const exportFieldMappingSchema = z.record(
    z.string(),
    exportFieldMappingItemSchema,
);
export type ExportFieldMapping = z.infer<typeof exportFieldMappingSchema>;

// Export Stats Schema
export const exportStatsSchema = z.object({
    totalExports: z.number(),
    successRate: z.number().min(0).max(1),
    averageFileSize: z.number(),
    popularFormats: z.record(exportFormatSchema, z.number()),
    recentExports: z.array(exportJobSchema),
});
export type ExportStats = z.infer<typeof exportStatsSchema>;
