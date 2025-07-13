import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { type UploadStatus } from "@/schema/uploadSchema";
import { logError, logInfo } from "./logUtils";
import { processWithOpenAI } from "./aiProcessUtil";

/**
 * Dual storage coordination utilities
 * Orchestrates uploads to both AWS S3 and OpenAI with proper error handling
 */

// ===== Main Dual Storage Functions =====

/**
 * Upload file to both S3 and OpenAI with progress tracking
 * Implements the dual storage architecture:
 * 1. Upload to S3 for permanent archival storage
 * 2. Upload to OpenAI for temporary AI processing
 * 3. Return both references for processing workflow
 */
export const uploadToDualStorage = async (
    file: File,
    userId: string,
    onProgressUpdate?: (status: UploadStatus, progress: number) => void,
): Promise<{
    success: boolean;
    s3ObjectKey?: string;
    openaiFileId?: string;
    error?: string;
}> => {
    try {
        // Stage 1: Upload to S3 for permanent storage
        onProgressUpdate?.("UPLOADING_STAGE_1", 0);

        const { uploadToS3 } = await import("./awsUtils");
        const s3Result = await uploadToS3(file, userId);

        if (!s3Result.success) {
            return {
                success: false,
                error: s3Result.error,
            };
        }

        onProgressUpdate?.("UPLOADING_STAGE_1", 50);

        // Stage 2: Upload to OpenAI for temporary processing
        onProgressUpdate?.("UPLOADING_STAGE_2", 60);

        const { uploadToOpenAI } = await import("./aiUploadUtil");
        const openaiResult = await uploadToOpenAI(file);

        if (!openaiResult.success) {
            // S3 upload succeeded but OpenAI failed
            // We keep the S3 file for manual processing
            logError("OpenAI upload failed but S3 succeeded", {
                s3ObjectKey: s3Result.s3ObjectKey,
                error: openaiResult.error,
            });

            return {
                success: false,
                s3ObjectKey: s3Result.s3ObjectKey,
                error: openaiResult.error,
            };
        }

        onProgressUpdate?.("UPLOADING_STAGE_2", 100);

        logInfo("Dual storage upload completed successfully", {
            s3ObjectKey: s3Result.s3ObjectKey,
            openaiFileId: openaiResult.openaiFileId,
            userId,
        });

        return {
            success: true,
            s3ObjectKey: s3Result.s3ObjectKey,
            openaiFileId: openaiResult.openaiFileId,
        };
    } catch (error) {
        logError("Dual storage upload failed", {
            error,
            userId,
            fileName: file.name,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.FILE_UPLOAD_FAILED,
        };
    }
};

/**
 * Complete dual storage workflow with AI processing
 * This is the main function for the invoice upload and processing flow
 */
export const processDualStorageWorkflow = async (
    file: File,
    userId: string,
    onProgressUpdate?: (status: UploadStatus, progress: number) => void,
): Promise<{
    success: boolean;
    s3ObjectKey?: string;
    extractedData?: any;
    error?: string;
}> => {
    try {
        // Step 1 & 2: Upload to both storages
        const uploadResult = await uploadToDualStorage(
            file,
            userId,
            onProgressUpdate,
        );

        if (!uploadResult.success) {
            return {
                success: false,
                s3ObjectKey: uploadResult.s3ObjectKey, // May exist if S3 succeeded
                error: uploadResult.error,
            };
        }

        // Step 3: Process with OpenAI
        onProgressUpdate?.("PROCESSING", 0);

        const extractedData = await processWithOpenAI(
            uploadResult.openaiFileId!,
            onProgressUpdate,
        );

        // Step 4: Cleanup OpenAI file (success or failure)
        if (uploadResult.openaiFileId) {
            const { deleteOpenAIFile } = await import("./aiUploadUtil");
            await deleteOpenAIFile(uploadResult.openaiFileId);
            logInfo("OpenAI file cleanup completed", {
                userId,
                openaiFileId: uploadResult.openaiFileId,
                fileName: file.name,
                success: true,
            });
        }

        onProgressUpdate?.("COMPLETED", 100);

        return {
            success: true,
            s3ObjectKey: uploadResult.s3ObjectKey,
            extractedData,
        };
    } catch (error) {
        logError("Dual storage workflow failed", {
            error,
            userId,
            fileName: file.name,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.UNKNOWN_ERROR,
        };
    }
};
