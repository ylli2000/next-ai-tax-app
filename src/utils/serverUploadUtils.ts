import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { ExtractedInvoiceData } from "@/schema/aiSchema";
import { createInvoiceFile } from "@/dal/invoice/createInvoiceFile";
import { logError, logInfo } from "./logUtils";
import { processWithOpenAIVision } from "./aiProcessingUtil";
import {
    generateS3ObjectKey,
    generatePresignedUploadUrl,
    generatePresignedDownloadUrl,
    checkS3FileExists,
} from "./awsUtils";

/**
 * Server-side upload processing utilities
 * Supports the client-side upload workflow with server-side coordination
 * - Generates S3 pre-signed URLs for secure client uploads
 * - Processes uploaded images with OpenAI Vision API
 * - Creates database records for successful uploads
 * - Provides file access management for secure downloads
 */

// ===== Server-side API Function Types =====

interface RequestUploadUrlParams {
    fileName: string;
    contentType: string;
    fileSize: number;
    userId: string;
}

interface ProcessWithAIParams {
    s3ObjectKey: string;
    userId: string;
}

// ===== Server-side API Functions =====

/**
 * API Function: Generate S3 pre-signed upload URL
 * Called by client before uploading file to S3
 * Endpoint: POST /api/files/request-upload-url
 */
export const handleRequestUploadUrl = async ({
    fileName,
    contentType,
    fileSize,
    userId,
}: RequestUploadUrlParams): Promise<{
    success: boolean;
    presignedUrl?: string;
    s3ObjectKey?: string;
    error?: string;
}> => {
    try {
        // Validate parameters
        const validation = validateUploadParams({
            fileName,
            contentType,
            fileSize,
            userId,
        });
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error,
            };
        }

        // Generate S3 object key
        const s3ObjectKey = generateS3ObjectKey(userId, fileName);

        // Generate pre-signed upload URL (15 minutes expiry)
        const presignedResult = await generatePresignedUploadUrl(
            s3ObjectKey,
            contentType,
            900, // 15 minutes
        );

        if (!presignedResult.success) {
            return {
                success: false,
                error: ERROR_MESSAGES.S3_DIRECT_UPLOAD_FAILED,
            };
        }

        logInfo("S3 pre-signed upload URL generated", {
            s3ObjectKey,
            fileName,
            fileSize,
            userId,
        });

        return {
            success: true,
            presignedUrl: presignedResult.signedUrl,
            s3ObjectKey,
        };
    } catch (error) {
        logError("Failed to generate S3 upload URL", {
            error,
            fileName,
            userId,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_DIRECT_UPLOAD_FAILED,
        };
    }
};

/**
 * API Function: Process uploaded file with AI
 * Called by client after successful S3 upload
 * Endpoint: POST /api/files/process-with-ai
 */
export const handleProcessWithAI = async ({
    s3ObjectKey,
    userId,
}: ProcessWithAIParams): Promise<{
    success: boolean;
    fileId?: string;
    extractedData?: ExtractedInvoiceData;
    error?: string;
}> => {
    try {
        // Validate parameters
        const validation = validateAIParams({ s3ObjectKey, userId });
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error,
            };
        }

        // Step 1: Verify S3 file exists
        const fileExists = await checkS3FileExists(s3ObjectKey);
        if (!fileExists) {
            return {
                success: false,
                error: "File not found in cloud storage. Please try uploading again.",
            };
        }

        // Step 2: Generate S3 download URL for OpenAI Vision
        const downloadUrlResult = await generatePresignedDownloadUrl(
            s3ObjectKey,
            3600, // 1 hour expiry
        );

        if (!downloadUrlResult.success) {
            return {
                success: false,
                error: ERROR_MESSAGES.S3_DIRECT_UPLOAD_FAILED,
            };
        }

        // Step 3: Create database file record
        const fileName = s3ObjectKey.split("/").pop() || "unknown";
        const invoiceFile = await createInvoiceFile({
            originalName: fileName,
            fileName: fileName,
            fileSize: 0, // Will be updated if needed
            mimeType: "image/jpeg", // Processed images are JPEG
            s3ObjectKey,
        });

        // Step 4: Process with OpenAI Vision
        const extractedData = await processWithOpenAIVision(
            downloadUrlResult.signedUrl!,
        );

        logInfo("AI processing completed successfully", {
            fileId: invoiceFile.id,
            s3ObjectKey,
            userId,
            extractedData: {
                invoiceNumber: extractedData.invoiceNumber,
                supplierName: extractedData.supplierName,
                totalAmount: extractedData.totalAmount,
            },
        });

        return {
            success: true,
            fileId: invoiceFile.id,
            extractedData,
        };
    } catch (error) {
        logError("Failed to process file with AI", {
            error,
            s3ObjectKey,
            userId,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.AI_PROCESSING_FAILED,
        };
    }
};

// ===== Utility Functions =====

/**
 * Get file access URL for viewing/downloading
 * Generates pre-signed download URL for client access
 */
export const getFileAccessUrl = async (
    s3ObjectKey: string,
    expirySeconds: number = 3600, // 1 hour default
): Promise<{
    success: boolean;
    accessUrl?: string;
    error?: string;
}> => {
    try {
        const result = await generatePresignedDownloadUrl(
            s3ObjectKey,
            expirySeconds,
        );

        if (!result.success) {
            return {
                success: false,
                error: "Failed to generate file access URL",
            };
        }

        return {
            success: true,
            accessUrl: result.signedUrl,
        };
    } catch (error) {
        logError("Failed to get file access URL", { error, s3ObjectKey });
        return {
            success: false,
            error: "Failed to generate file access URL",
        };
    }
};

/**
 * Validate file upload parameters
 */
export const validateUploadParams = ({
    fileName,
    contentType,
    fileSize,
    userId,
}: RequestUploadUrlParams): {
    isValid: boolean;
    error?: string;
} => {
    if (!fileName || fileName.trim().length === 0) {
        return { isValid: false, error: "File name is required" };
    }

    if (!contentType || !contentType.startsWith("image/")) {
        return { isValid: false, error: "Only image files are supported" };
    }

    if (!fileSize || fileSize <= 0 || fileSize > 10 * 1024 * 1024) {
        return {
            isValid: false,
            error: "File size must be between 1 byte and 10MB",
        };
    }

    if (!userId || userId.trim().length === 0) {
        return { isValid: false, error: "User ID is required" };
    }

    return { isValid: true };
};

/**
 * Validate AI processing parameters
 */
export const validateAIParams = ({
    s3ObjectKey,
    userId,
}: ProcessWithAIParams): {
    isValid: boolean;
    error?: string;
} => {
    if (!s3ObjectKey || s3ObjectKey.trim().length === 0) {
        return { isValid: false, error: "S3 object key is required" };
    }

    if (!userId || userId.trim().length === 0) {
        return { isValid: false, error: "User ID is required" };
    }

    return { isValid: true };
};

/**
 * Health check for upload services
 */
export const checkUploadServiceHealth = async (): Promise<{
    healthy: boolean;
    services: {
        s3: boolean;
        ai: boolean;
    };
    error?: string;
}> => {
    try {
        // Test S3 connectivity (generate a test pre-signed URL)
        const testS3 = await generatePresignedUploadUrl(
            "health-check/test.jpg",
            "image/jpeg",
            60, // 1 minute
        );

        const services = {
            s3: testS3.success,
            ai: true, // AI service health would require actual OpenAI API call
        };

        return {
            healthy: services.s3 && services.ai,
            services,
        };
    } catch (error) {
        logError("Upload service health check failed", { error });
        return {
            healthy: false,
            services: { s3: false, ai: false },
            error: "Health check failed",
        };
    }
};
