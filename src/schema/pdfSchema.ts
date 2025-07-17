import { z } from "zod";

/**
 * PDF processing schemas and types
 * Contains all PDF-related enums, constants, request schemas, and response types
 */

// ===== PDF File Type Enums =====

export const PdfMimeTypeEnum = ["application/pdf"] as const;
export const pdfMimeTypeSchema = z.enum(PdfMimeTypeEnum);
export type PdfMimeType = z.infer<typeof pdfMimeTypeSchema>;

export const PdfExtensionEnum = [".pdf"] as const;
export const pdfExtensionSchema = z.enum(PdfExtensionEnum);
export type PdfExtension = z.infer<typeof pdfExtensionSchema>;

export const PdfConvertImageTypeEnum = ["image/jpeg", "image/png"] as const;
export const pdfConvertImageTypeSchema = z.enum(PdfConvertImageTypeEnum);
export type PdfConvertImageType = z.infer<typeof pdfConvertImageTypeSchema>;

// ===== PDF Processing Constants =====

export const PDF_PROCESSING = {
    DEFAULT_SCALE: 2.0,
    DEFAULT_PAGE_NUMBER: 1,
    DEFAULT_OUTPUT_FORMAT: "image/jpeg" as PdfConvertImageType,
    DEFAULT_QUALITY: 0.9, // Increased from 0.8 for better quality
    DEFAULT_MAX_WIDTH: 1920,
    DEFAULT_MAX_HEIGHT: 1080,
    MAX_READ_PDF_PAGES: 3,
    PDF_JS_URL: "//unpkg.com/pdfjs-dist@{version}/build/pdf.worker.min.js",

    // Long image specific defaults
    DEFAULT_PAGE_SPACING: 20,
    DEFAULT_ADD_PAGE_SEPARATOR: true,
    DEFAULT_SEPARATOR_COLOR: "#e0e0e0",
    DEFAULT_SEPARATOR_THICKNESS: 2,
} as const;

// ===== Request Schemas (with Zod validation) =====

// Base PDF processing options schema
export const pdfProcessingBaseOptionsSchema = z.object({
    scale: z
        .number()
        .min(0.1)
        .max(10)
        .optional()
        .default(PDF_PROCESSING.DEFAULT_SCALE),
    outputFormat: pdfConvertImageTypeSchema
        .optional()
        .default(PDF_PROCESSING.DEFAULT_OUTPUT_FORMAT),
    quality: z
        .number()
        .min(0.1)
        .max(1)
        .optional()
        .default(PDF_PROCESSING.DEFAULT_QUALITY),
    maxWidth: z
        .number()
        .min(100)
        .max(4000)
        .optional()
        .default(PDF_PROCESSING.DEFAULT_MAX_WIDTH),
    maxHeight: z
        .number()
        .min(100)
        .max(4000)
        .optional()
        .default(PDF_PROCESSING.DEFAULT_MAX_HEIGHT),
});

// Single page conversion options schema
export const pdfSinglePageOptionsSchema = pdfProcessingBaseOptionsSchema.extend(
    {
        pageNumber: z
            .number()
            .min(1)
            .optional()
            .default(PDF_PROCESSING.DEFAULT_PAGE_NUMBER),
    },
);

// Multi-page conversion options schema
export const pdfMultiPageOptionsSchema = pdfProcessingBaseOptionsSchema.extend({
    maxPages: z
        .number()
        .min(1)
        .max(20)
        .optional()
        .default(PDF_PROCESSING.MAX_READ_PDF_PAGES),
});

// Long image conversion options schema
export const pdfLongImageOptionsSchema = pdfProcessingBaseOptionsSchema.extend({
    maxPages: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(PDF_PROCESSING.MAX_READ_PDF_PAGES),
    pageSpacing: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .default(PDF_PROCESSING.DEFAULT_PAGE_SPACING),
    addPageSeparator: z
        .boolean()
        .optional()
        .default(PDF_PROCESSING.DEFAULT_ADD_PAGE_SEPARATOR),
    separatorColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional()
        .default(PDF_PROCESSING.DEFAULT_SEPARATOR_COLOR),
    separatorThickness: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(PDF_PROCESSING.DEFAULT_SEPARATOR_THICKNESS),
});

// Smart processing options schema (combines all options)
export const pdfSmartProcessingOptionsSchema =
    pdfProcessingBaseOptionsSchema.extend({
        maxPages: z
            .number()
            .min(1)
            .max(10)
            .optional()
            .default(PDF_PROCESSING.MAX_READ_PDF_PAGES),
        // Long image specific options
        pageSpacing: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .default(PDF_PROCESSING.DEFAULT_PAGE_SPACING),
        addPageSeparator: z
            .boolean()
            .optional()
            .default(PDF_PROCESSING.DEFAULT_ADD_PAGE_SEPARATOR),
        separatorColor: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/)
            .optional()
            .default(PDF_PROCESSING.DEFAULT_SEPARATOR_COLOR),
        separatorThickness: z
            .number()
            .min(1)
            .max(10)
            .optional()
            .default(PDF_PROCESSING.DEFAULT_SEPARATOR_THICKNESS),
    });

// ===== Inferred Request Types =====

export type PdfProcessingBaseOptions = z.infer<
    typeof pdfProcessingBaseOptionsSchema
>;
export type PdfSinglePageOptions = z.infer<typeof pdfSinglePageOptionsSchema>;
export type PdfMultiPageOptions = z.infer<typeof pdfMultiPageOptionsSchema>;
export type PdfLongImageOptions = z.infer<typeof pdfLongImageOptionsSchema>;
export type PdfSmartProcessingOptions = z.infer<
    typeof pdfSmartProcessingOptionsSchema
>;

// ===== Response Types (plain TypeScript) =====

// Base result type
export type PdfProcessingResult = {
    success: boolean;
    error?: string;
};

// Page count result
export type PdfPageCountResult = PdfProcessingResult & {
    pageCount?: number;
};

// Single file result (for convertPdfToImage, smartPdfProcessing)
export type PdfSingleFileResult = PdfProcessingResult & {
    imageFile?: File;
    pageCount?: number;
    selectedPage?: number;
    totalHeight?: number;
    processedPages?: number;
    strategy?: string;
};

// Multiple files result (for convertPdfToImages)
export type PdfMultipleFilesResult = PdfProcessingResult & {
    imageFiles?: File[];
    pageCount?: number;
};

// Long image specific result
export type PdfLongImageResult = PdfProcessingResult & {
    imageFile?: File;
    pageCount?: number;
    totalHeight?: number;
    processedPages?: number;
};

// ===== Validation Helpers =====

/**
 * Validate PDF processing base options
 */
export const validatePdfBaseOptions = (
    options: unknown,
): PdfProcessingBaseOptions =>
    pdfProcessingBaseOptionsSchema.parse(options || {});

/**
 * Validate single page conversion options
 */
export const validatePdfSinglePageOptions = (
    options: unknown,
): PdfSinglePageOptions => pdfSinglePageOptionsSchema.parse(options || {});

/**
 * Validate multi-page conversion options
 */
export const validatePdfMultiPageOptions = (
    options: unknown,
): PdfMultiPageOptions => pdfMultiPageOptionsSchema.parse(options || {});

/**
 * Validate long image conversion options
 */
export const validatePdfLongImageOptions = (
    options: unknown,
): PdfLongImageOptions => pdfLongImageOptionsSchema.parse(options || {});

/**
 * Validate smart processing options
 */
export const validatePdfSmartProcessingOptions = (
    options: unknown,
): PdfSmartProcessingOptions =>
    pdfSmartProcessingOptionsSchema.parse(options || {});

// ===== Processing Strategy Types =====

export type PdfProcessingStrategy =
    | "single-page"
    | "first-page"
    | `long-image-${number}-pages`;
