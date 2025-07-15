import { z } from "zod";
import { ERROR_MESSAGES } from "./messageSchema";

/**
 * Upload schemas using Zod for runtime validation and type inference
 * Handles pure file upload functionality only
 */

// File type categorization
export const PdfMimeTypeEnum = ["application/pdf"] as const;
export const pdfMimeTypeSchema = z.enum(PdfMimeTypeEnum);
export type PdfMimeType = z.infer<typeof pdfMimeTypeSchema>;

export const ImageMimeTypeEnum = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
] as const;
export const imageMimeTypeSchema = z.enum(ImageMimeTypeEnum);
export type ImageMimeType = z.infer<typeof imageMimeTypeSchema>;

export const ImageExtensionEnum = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
] as const;
export const imageExtensionSchema = z.enum(ImageExtensionEnum);
export type ImageExtension = z.infer<typeof imageExtensionSchema>;

export const PdfExtensionEnum = [".pdf"] as const;
export const pdfExtensionSchema = z.enum(PdfExtensionEnum);
export type PdfExtension = z.infer<typeof pdfExtensionSchema>;

// File type enums
export const AllowedMimeTypeEnum = [
    ...ImageMimeTypeEnum,
    ...PdfMimeTypeEnum,
] as const;
export const allowedMimeTypeSchema = z.enum(AllowedMimeTypeEnum);
export type AllowedMimeType = z.infer<typeof allowedMimeTypeSchema>;

export const AllowedExtensionEnum = [
    ...ImageExtensionEnum,
    ...PdfExtensionEnum,
] as const;
export const allowedExtensionSchema = z.enum(AllowedExtensionEnum);
export type AllowedExtension = z.infer<typeof allowedExtensionSchema>;

// File upload progress status - New simplified 6-state workflow
export const UploadStatusEnum = [
    "NOT_UPLOADED", // 初始状态：等待开始上传
    "PROCESSING_PDF", // 客户端PDF转图像处理中
    "COMPRESSING_IMAGE", // 客户端图像压缩中
    "UPLOADING_TO_S3", // 上传图像到S3存储
    "AI_PROCESSING", // OpenAI Vision分析S3图像
    "COMPLETED", // 全流程完成
    "FAILED", // 失败状态
] as const;
export const uploadStatusSchema = z.enum(UploadStatusEnum);
export type UploadStatus = z.infer<typeof uploadStatusSchema>;

// Upload error code enum
export const UploadErrorCodeEnum = [
    "FILE_TOO_LARGE",
    "INVALID_TYPE",
    "UPLOAD_FAILED",
    "PROCESSING_FAILED",
    "AI_EXTRACTION_FAILED",
] as const;
export const uploadErrorCodeSchema = z.enum(UploadErrorCodeEnum);
export type UploadErrorCode = z.infer<typeof uploadErrorCodeSchema>;

// Upload status display constants for UI
export const UPLOAD_STATUS_MESSAGES: Record<UploadStatus, string> = {
    NOT_UPLOADED: "Ready to upload",
    PROCESSING_PDF: "Converting PDF to image...",
    COMPRESSING_IMAGE: "Optimizing image quality...",
    UPLOADING_TO_S3: "Uploading to cloud storage...",
    AI_PROCESSING: "AI analyzing your invoice...",
    COMPLETED: "Upload and analysis completed",
    FAILED: "Upload failed",
} as const;

export const UPLOAD_STATUS_COLORS: Record<UploadStatus, string> = {
    NOT_UPLOADED: "gray",
    PROCESSING_PDF: "purple",
    COMPRESSING_IMAGE: "indigo",
    UPLOADING_TO_S3: "blue",
    AI_PROCESSING: "orange",
    COMPLETED: "green",
    FAILED: "red",
} as const;

export const UPLOAD_STATUS_ICONS: Record<UploadStatus, string> = {
    NOT_UPLOADED: "upload",
    PROCESSING_PDF: "file-text",
    COMPRESSING_IMAGE: "image",
    UPLOADING_TO_S3: "loading",
    AI_PROCESSING: "cog",
    COMPLETED: "check",
    FAILED: "x",
} as const;

// File Size Constants
export const FILE_SIZE_CONSTANTS = {
    MAX_FILENAME_LENGTH: 255, // Used in fileUtils.ts for filename length validation
    BYTES_PER_KB: 1024, // Used in formatUtils.ts for file size calculations
    BYTES_PER_MB: 1024 * 1024, // Used in formatUtils.ts and upload validation
    BYTES_PER_GB: 1024 * 1024 * 1024, // Used in formatUtils.ts for large file display
} as const;

// File Upload Constants - referencing schema enums for consistency
export const UPLOAD_CONSTANTS = {
    DEFAULT_UPLOAD_STATUS: "NOT_UPLOADED" as UploadStatus, // Used in UI initialization

    // File type arrays for validation
    IMAGE_EXTENSIONS: ImageExtensionEnum, // Used in uploadUtils.ts for image file validation
    PDF_EXTENSIONS: PdfExtensionEnum, // Used in uploadUtils.ts for document file validation
    ALLOWED_EXTENSIONS: AllowedExtensionEnum, // Used in uploadUtils.ts for overall file validation
    IMAGE_MIME_TYPES: ImageMimeTypeEnum, // Used in uploadUtils.ts for image MIME type validation
    PDF_MIME_TYPES: PdfMimeTypeEnum, // Used in uploadUtils.ts for document MIME type validation
    ALLOWED_MIME_TYPES: AllowedMimeTypeEnum, // Used in uploadUtils.ts for overall MIME type validation

    // Default accepted types string for file input
    DEFAULT_ALLOWED_TYPES_STRING: AllowedExtensionEnum.join(","), // Used in uploadUtils.ts for file input accept attribute

    // File size limit (from SYSTEM_DEFAULT)
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB - Used in uploadUtils.ts for file size validation
    TARGET_COMPRESSED_FILE_SIZE_IN_BYTES: 1 * 1024 * 1024, // 1MB - Used in uploadUtils.ts for file size validation

    // PDF processing limits
    MAX_READ_PDF_PAGES: 3, // Maximum pages to read from PDF for long image creation
    // Filename length limit
    MAX_FILENAME_LENGTH: FILE_SIZE_CONSTANTS.MAX_FILENAME_LENGTH, // Used in uploadUtils.ts for filename validation

    // Image compression defaults for uploadUtils.ts
    IMAGE_COMPRESSION: {
        DEFAULT_MAX_WIDTH: 1920, // Used in uploadUtils.ts for image compression width limit
        DEFAULT_MAX_HEIGHT: 1080, // Used in uploadUtils.ts for image compression height limit
        DEFAULT_QUALITY: 0.8, // Used in uploadUtils.ts for image compression quality
        DEFAULT_OUTPUT_FORMAT: "image/jpeg" as ImageMimeType, // Used in uploadUtils.ts for image compression output format
    },
    // Filename safety for uploadUtils.ts
    UNSAFE_FILENAME_CHARS: /[<>:"/\\|?*]/g, // Used in uploadUtils.ts for filename sanitization

    // Frontend multi-file upload constants
    AVERAGE_UPLOAD_SPEED_BYTES_PER_SECOND: 1024 * 100, // 100KB/s estimated upload speed for time calculation (frontend display only)

    // Default fallback values for UI display
    DEFAULT_STATUS_MESSAGE: UPLOAD_STATUS_MESSAGES.NOT_UPLOADED, // Fallback to NOT_UPLOADED status message
    DEFAULT_STATUS_COLOR: UPLOAD_STATUS_COLORS.NOT_UPLOADED, // Default color for unknown status
    DEFAULT_STATUS_ICON: UPLOAD_STATUS_ICONS.NOT_UPLOADED, // Default icon for unknown status
} as const;

// Upload status transitions matrix for validation
export const VALID_STATUS_TRANSITIONS: Record<UploadStatus, UploadStatus[]> = {
    NOT_UPLOADED: [
        "PROCESSING_PDF",
        "COMPRESSING_IMAGE",
        "UPLOADING_TO_S3",
        "FAILED",
    ], // PDF files go through PDF processing, images skip to compression or upload
    PROCESSING_PDF: ["COMPRESSING_IMAGE", "FAILED"],
    COMPRESSING_IMAGE: ["UPLOADING_TO_S3", "FAILED"],
    UPLOADING_TO_S3: ["AI_PROCESSING", "FAILED"],
    AI_PROCESSING: ["COMPLETED", "FAILED"],
    COMPLETED: [], // Terminal state
    FAILED: ["NOT_UPLOADED"], // Can retry
} as const;

// Upload configuration schema
export const uploadConfigSchema = z.object({
    maxSize: z.number().min(0).default(UPLOAD_CONSTANTS.MAX_FILE_SIZE), //bytes
    allowedTypes: z.array(z.string()).default([...AllowedMimeTypeEnum]),
    multiple: z.boolean().default(false),
});
export type UploadConfig = z.infer<typeof uploadConfigSchema>;

//refine rules to check MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS
export const validFileFormatSchema = z
    .instanceof(File)
    .refine((file) => file.size <= UPLOAD_CONSTANTS.MAX_FILE_SIZE, {
        message: ERROR_MESSAGES.FILE_TOO_LARGE,
    })
    .refine(
        (file) =>
            (AllowedExtensionEnum as readonly string[]).includes(
                "." + file.name.split(".").pop()?.toLowerCase(),
            ),
        {
            message: ERROR_MESSAGES.INVALID_FILE_TYPE,
        },
    )
    .refine(
        (file) =>
            (AllowedMimeTypeEnum as readonly string[]).includes(file.type),
        {
            message: ERROR_MESSAGES.INVALID_FILE_TYPE,
        },
    );

// Upload error schema
export const uploadErrorSchema = z.object({
    code: uploadErrorCodeSchema,
    message: z.string(),
    details: z.record(z.unknown()).optional(),
});
export type UploadError = z.infer<typeof uploadErrorSchema>;

// File upload progress tracking schema
export const fileUploadProgressSchema = z.object({
    id: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
    file: validFileFormatSchema,
    status: uploadStatusSchema,
    progress: z.number().min(0).max(100),
    error: z.string().optional(),
});
export type FileUploadProgress = z.infer<typeof fileUploadProgressSchema>;

// Upload result schema (file information only, no invoice content)
export const uploadResultSchema = z.object({
    fileId: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
    originalName: z.string().min(1),
    fileName: z.string().min(1),
    fileSize: z.number().min(0),
    mimeType: z.string(),
    s3ObjectKey: z.string().min(1),
});
export type UploadResult = z.infer<typeof uploadResultSchema>;

// File upload validation schema (for API endpoints)
export const fileUploadValidationSchema = z.object({
    file: validFileFormatSchema,
    userId: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
});
export type FileUploadValidation = z.infer<typeof fileUploadValidationSchema>;

// Upload progress update schema
export const uploadProgressSchema = z.object({
    id: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
    progress: z.number().min(0).max(100),
    status: uploadStatusSchema,
    error: z.string().optional(),
});
export type UploadProgress = z.infer<typeof uploadProgressSchema>;

// Note: Frontend parallel upload uses individual file uploads with independent pre-signed URLs
// No backend bulk upload schema needed - each file follows the single-file workflow

// Upload completion schema (file upload completion, not invoice processing)
export const uploadCompletionSchema = z.object({
    id: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
    result: uploadResultSchema,
});
export type UploadCompletion = z.infer<typeof uploadCompletionSchema>;
