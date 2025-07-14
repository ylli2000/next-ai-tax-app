import { createId } from "@paralleldrive/cuid2";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { type UploadStatus } from "@/schema/uploadSchema";
import { ExtractedInvoiceData } from "@/schema/aiSchema";
import { createInvoiceFile } from "@/dal/invoice/createInvoiceFile";
import { logError, logInfo } from "./logUtils";
import { processWithOpenAI } from "./aiProcessUtil";
import {
    generateS3ObjectKey,
    generatePresignedUploadUrl,
    confirmS3FileUpload,
} from "./awsUtils";
import { uploadToOpenAI, deleteOpenAIFile } from "./aiUploadUtil";

/**
 * Dual storage coordination utilities with pre-signed URL workflow
 * Orchestrates client-side S3 uploads and server-side OpenAI processing
 */

// ===== Upload Session Management =====

interface UploadSession {
    userId: string;
    s3ObjectKey: string;
    openaiFileId?: string;
    originalFileName: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
    expiresAt: Date;
}

// In-memory session storage (for development/simple deployment)
// TODO: Replace with Redis or database storage for production scaling
const uploadSessions = new Map<string, UploadSession>();

// ===== Main Pre-signed URL Workflow Functions =====

/**
 * Initiate dual storage workflow with pre-signed URL
 * 1. Generate S3 pre-signed URL for client-side upload
 * 2. Upload file to OpenAI for AI processing
 * 3. Create upload session for tracking
 * 4. Return pre-signed URL and session ID to client
 */
export const initiateDualStorageWorkflow = async (
    file: File,
    userId: string,
    onProgressUpdate?: (status: UploadStatus, progress: number) => void,
): Promise<{
    success: boolean;
    presignedUploadUrl?: string;
    s3ObjectKey?: string;
    uploadSessionId?: string;
    error?: string;
}> => {
    try {
        onProgressUpdate?.("NOT_UPLOADED", 0);

        // Step 1: Generate S3 pre-signed URL
        const s3ObjectKey = generateS3ObjectKey(userId, file.name);
        const presignedResult = await generatePresignedUploadUrl(
            s3ObjectKey,
            file.type,
            900, // 15 minutes for upload
        );

        if (!presignedResult.success) {
            return {
                success: false,
                error: ERROR_MESSAGES.PRESIGNED_URL_GENERATION_FAILED,
            };
        }

        onProgressUpdate?.("PRESIGNED_GENERATED", 5);

        // Step 2: Upload to OpenAI for temporary processing
        onProgressUpdate?.("AI_UPLOADING", 20);

        const openaiResult = await uploadToOpenAI(file);

        if (!openaiResult.success) {
            return {
                success: false,
                error: openaiResult.error,
            };
        }

        onProgressUpdate?.("AI_UPLOADING", 45);

        // Step 3: Create upload session
        const uploadSessionId = createId();
        createUploadSession(
            uploadSessionId,
            userId,
            s3ObjectKey,
            openaiResult.openaiFileId!,
            file.name,
            file.size,
            file.type,
        );

        onProgressUpdate?.("PRESIGNED_GENERATED", 50);

        logInfo("Dual storage workflow initiated successfully", {
            s3ObjectKey,
            openaiFileId: openaiResult.openaiFileId,
            uploadSessionId,
            userId,
        });

        return {
            success: true,
            presignedUploadUrl: presignedResult.signedUrl,
            s3ObjectKey,
            uploadSessionId,
        };
    } catch (error) {
        logError("Failed to initiate dual storage workflow", { error, userId });
        return {
            success: false,
            error: ERROR_MESSAGES.UNKNOWN_ERROR,
        };
    }
};

/**
 * Confirm upload and complete AI processing workflow
 * Called after client has uploaded file to S3 using pre-signed URL
 * 1. Verify upload session exists and is valid
 * 2. Confirm S3 file upload was successful
 * 3. Create database record for the file
 * 4. Process with OpenAI AI
 * 5. Clean up temporary resources
 */
export const confirmUploadAndProcessAI = async (
    uploadSessionId: string,
    onProgressUpdate?: (status: UploadStatus, progress: number) => void,
): Promise<{
    success: boolean;
    fileId?: string;
    extractedData?: ExtractedInvoiceData;
    error?: string;
}> => {
    try {
        // Step 1: Validate upload session
        const session = getUploadSession(uploadSessionId);

        if (!session) {
            return {
                success: false,
                error: ERROR_MESSAGES.UPLOAD_SESSION_NOT_FOUND,
            };
        }

        onProgressUpdate?.("UPLOAD_CONFIRMED", 45);

        // Step 2: Confirm S3 file exists
        const confirmResult = await confirmS3FileUpload(session.s3ObjectKey);

        if (!confirmResult.success || !confirmResult.fileExists) {
            return {
                success: false,
                error:
                    confirmResult.error || ERROR_MESSAGES.S3_FILE_NOT_CONFIRMED,
            };
        }

        onProgressUpdate?.("UPLOAD_CONFIRMED", 50);

        // Step 3: Create database file record
        const invoiceFile = await createInvoiceFile({
            originalName: session.originalFileName,
            fileName: session.s3ObjectKey.split("/").pop()!,
            fileSize: confirmResult.metadata!.size,
            mimeType: session.mimeType,
            s3ObjectKey: session.s3ObjectKey,
        });

        onProgressUpdate?.("PROCESSING", 60);

        // Step 4: Process with OpenAI
        const extractedData = await processWithOpenAI(
            session.openaiFileId!,
            onProgressUpdate,
        );

        // Step 5: Cleanup OpenAI file and session
        if (session.openaiFileId) {
            await deleteOpenAIFile(session.openaiFileId);
            logInfo("OpenAI file cleanup completed", {
                userId: session.userId,
                openaiFileId: session.openaiFileId,
                fileName: session.originalFileName,
                success: true,
            });
        }
        deleteUploadSession(uploadSessionId);

        onProgressUpdate?.("COMPLETED", 100);

        logInfo("Upload confirmation and AI processing completed", {
            fileId: invoiceFile.id,
            s3ObjectKey: session.s3ObjectKey,
            userId: session.userId,
        });

        return {
            success: true,
            fileId: invoiceFile.id,
            extractedData,
        };
    } catch (error) {
        logError("Failed to confirm upload and process AI", {
            error,
            uploadSessionId,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.UNKNOWN_ERROR,
        };
    }
};

// ===== Upload Session Helper Functions =====

/**
 * Create upload session with expiration
 */
const createUploadSession = (
    sessionId: string,
    userId: string,
    s3ObjectKey: string,
    openaiFileId: string,
    originalFileName: string,
    fileSize: number,
    mimeType: string,
): UploadSession => {
    const session: UploadSession = {
        userId,
        s3ObjectKey,
        openaiFileId,
        originalFileName,
        fileSize,
        mimeType,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    uploadSessions.set(sessionId, session);

    logInfo("Upload session created", {
        sessionId,
        userId,
        s3ObjectKey,
        expiresAt: session.expiresAt,
    });

    return session;
};

/**
 * Get upload session by ID
 */
const getUploadSession = (sessionId: string): UploadSession | null => {
    const session = uploadSessions.get(sessionId);

    if (!session) {
        logError("Upload session not found", { sessionId });
        return null;
    }

    if (session.expiresAt < new Date()) {
        uploadSessions.delete(sessionId);
        logError("Upload session expired and deleted", {
            sessionId,
            expiresAt: session.expiresAt,
        });
        return null;
    }

    return session;
};

/**
 * Delete upload session
 */
const deleteUploadSession = (sessionId: string): void => {
    const deleted = uploadSessions.delete(sessionId);

    if (deleted) {
        logInfo("Upload session deleted", { sessionId });
    } else {
        logError("Failed to delete upload session - not found", { sessionId });
    }
};

/**
 * Cleanup expired upload sessions
 * Should be called periodically or on application startup
 */
export const cleanupExpiredSessions = (): number => {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of uploadSessions.entries()) {
        if (session.expiresAt < now) {
            uploadSessions.delete(sessionId);
            cleanedCount++;
        }
    }

    if (cleanedCount > 0) {
        logInfo("Cleaned up expired upload sessions", {
            cleanedCount,
            remainingCount: uploadSessions.size,
        });
    }

    return cleanedCount;
};

/**
 * Get upload session statistics
 * Useful for monitoring and debugging
 */
export const getUploadSessionStats = (): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    oldestSessionAge: number;
} => {
    const now = new Date();
    let activeSessions = 0;
    let expiredSessions = 0;
    let oldestSessionAge = 0;

    for (const session of uploadSessions.values()) {
        if (session.expiresAt < now) {
            expiredSessions++;
        } else {
            activeSessions++;
        }

        const age = now.getTime() - session.createdAt.getTime();
        oldestSessionAge = Math.max(oldestSessionAge, age);
    }

    return {
        totalSessions: uploadSessions.size,
        activeSessions,
        expiredSessions,
        oldestSessionAge,
    };
};
