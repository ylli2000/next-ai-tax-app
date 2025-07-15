import {
    type UploadStatus,
    type UploadProgress,
    VALID_STATUS_TRANSITIONS,
} from "@/schema/uploadSchema";

/**
 * Upload status management utilities
 * Handles status tracking, transitions, and state management for UI components
 */

// ===== Status Creation and Management =====

/**
 * Create initial upload progress state
 */
export const createInitialUploadProgress = (
    fileId: string,
): UploadProgress => ({
    id: fileId,
    progress: 0,
    status: "NOT_UPLOADED",
    error: undefined,
});

/**
 * Update upload progress
 */
export const updateUploadProgress = (
    current: UploadProgress,
    updates: Partial<UploadProgress>,
): UploadProgress => ({
    ...current,
    ...updates,
});

/**
 * Create upload progress with specific status
 */
export const createUploadProgressWithStatus = (
    fileId: string,
    status: UploadStatus,
    progress: number = 0,
): UploadProgress => ({
    id: fileId,
    progress,
    status,
    error: undefined,
});

// ===== Status Validation and Transitions =====

/**
 * Check if status transition is valid
 */
export const isValidStatusTransition = (
    from: UploadStatus,
    to: UploadStatus,
): boolean => VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;

/**
 * Get next possible statuses from current status
 */
export const getNextPossibleStatuses = (
    current: UploadStatus,
): UploadStatus[] => VALID_STATUS_TRANSITIONS[current] || [];

// ===== Status Checking Utilities =====

/**
 * Check if upload is in initial state
 */
export const isUploadIdle = (status: UploadStatus): boolean =>
    status === "NOT_UPLOADED";

/**
 * Check if upload is currently processing
 */
export const isUploadProcessing = (status: UploadStatus): boolean =>
    status === "PROCESSING_PDF" ||
    status === "COMPRESSING_IMAGE" ||
    status === "UPLOADING_TO_S3" ||
    status === "AI_PROCESSING";

/**
 * Check if PDF is being processed
 */
export const isProcessingPdf = (status: UploadStatus): boolean =>
    status === "PROCESSING_PDF";

/**
 * Check if image is being compressed
 */
export const isCompressingImage = (status: UploadStatus): boolean =>
    status === "COMPRESSING_IMAGE";

/**
 * Check if file is uploading to S3
 */
export const isUploadingToS3 = (status: UploadStatus): boolean =>
    status === "UPLOADING_TO_S3";

/**
 * Check if upload is being processed by AI
 */
export const isAIProcessing = (status: UploadStatus): boolean =>
    status === "AI_PROCESSING";

/**
 * Check if upload completed successfully
 */
export const isUploadCompleted = (status: UploadStatus): boolean =>
    status === "COMPLETED";

/**
 * Check if upload failed
 */
export const isUploadFailed = (status: UploadStatus): boolean =>
    status === "FAILED";

/**
 * Check if upload can be retried
 */
export const canRetryUpload = (status: UploadStatus): boolean =>
    status === "FAILED" || status === "NOT_UPLOADED";

/**
 * Check if upload is in terminal state (completed or failed)
 */
export const isUploadTerminal = (status: UploadStatus): boolean =>
    status === "COMPLETED" || status === "FAILED";

// ===== Progress Calculation =====

/**
 * Get progress percentage based on status and stage
 */
export const getProgressForStatus = (
    status: UploadStatus,
    stageProgress: number = 0,
): number => {
    const baseProgress = {
        NOT_UPLOADED: 0,
        PROCESSING_PDF: 0 + Math.min(stageProgress * 0.2, 20), // 0-20%
        COMPRESSING_IMAGE: 20 + Math.min(stageProgress * 0.15, 15), // 20-35%
        UPLOADING_TO_S3: 35 + Math.min(stageProgress * 0.35, 35), // 35-70%
        AI_PROCESSING: 70 + Math.min(stageProgress * 0.3, 30), // 70-100%
        COMPLETED: 100,
        FAILED: 0,
    };

    return Math.min(100, Math.max(0, baseProgress[status] || 0));
};

/**
 * Calculate overall progress from multiple uploads
 */
export const calculateBulkProgress = (
    progresses: UploadProgress[],
): {
    overallProgress: number;
    completedCount: number;
    failedCount: number;
    processingCount: number;
    idleCount: number;
    pdfProcessingCount: number;
    imageProcessingCount: number;
    uploadingCount: number;
    aiProcessingCount: number;
} => {
    if (progresses.length === 0) {
        return {
            overallProgress: 0,
            completedCount: 0,
            failedCount: 0,
            processingCount: 0,
            idleCount: 0,
            pdfProcessingCount: 0,
            imageProcessingCount: 0,
            uploadingCount: 0,
            aiProcessingCount: 0,
        };
    }

    const totalProgress = progresses.reduce((sum, p) => sum + p.progress, 0);
    const overallProgress = totalProgress / progresses.length;

    const completedCount = progresses.filter((p) =>
        isUploadCompleted(p.status),
    ).length;
    const failedCount = progresses.filter((p) =>
        isUploadFailed(p.status),
    ).length;
    const processingCount = progresses.filter((p) =>
        isUploadProcessing(p.status),
    ).length;
    const idleCount = progresses.filter((p) => isUploadIdle(p.status)).length;

    // New detailed status counts
    const pdfProcessingCount = progresses.filter((p) =>
        isProcessingPdf(p.status),
    ).length;
    const imageProcessingCount = progresses.filter((p) =>
        isCompressingImage(p.status),
    ).length;
    const uploadingCount = progresses.filter((p) =>
        isUploadingToS3(p.status),
    ).length;
    const aiProcessingCount = progresses.filter((p) =>
        isAIProcessing(p.status),
    ).length;

    return {
        overallProgress,
        completedCount,
        failedCount,
        processingCount,
        idleCount,
        pdfProcessingCount,
        imageProcessingCount,
        uploadingCount,
        aiProcessingCount,
    };
};

// ===== Batch Operations =====

/**
 * Update multiple upload progresses
 */
export const updateMultipleProgresses = (
    progresses: UploadProgress[],
    updates: Record<string, Partial<UploadProgress>>,
): UploadProgress[] =>
    progresses.map((progress) => {
        const update = updates[progress.id];
        return update ? updateUploadProgress(progress, update) : progress;
    });

/**
 * Reset all progresses to initial state
 */
export const resetAllProgresses = (
    progresses: UploadProgress[],
): UploadProgress[] =>
    progresses.map((progress) => createInitialUploadProgress(progress.id));

/**
 * Get progresses by status
 */
export const getProgressesByStatus = (
    progresses: UploadProgress[],
    status: UploadStatus,
): UploadProgress[] =>
    progresses.filter((progress) => progress.status === status);

/**
 * Get failed progresses with errors
 */
export const getFailedProgresses = (
    progresses: UploadProgress[],
): UploadProgress[] =>
    progresses.filter(
        (progress) => isUploadFailed(progress.status) && progress.error,
    );
