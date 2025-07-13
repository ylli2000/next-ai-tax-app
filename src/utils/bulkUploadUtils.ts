import {
    UPLOAD_CONSTANTS,
    type UploadError,
    type UploadProgress,
    type UploadStatus,
} from "@/schema/uploadSchema";
import { formatFileSize } from "./formatUtils";
import { validateFiles } from "./fileUtils";
import { logError, logInfo } from "./logUtils";

/**
 * Bulk upload management utilities
 * Handles batch operations, progress tracking, and queue management
 */

// ===== File Organization =====

/**
 * Calculate total size of multiple files
 */
export const calculateTotalSize = (files: File[]): number =>
    files.reduce((total, file) => total + file.size, 0);

/**
 * Sort files by various criteria
 */
export const sortFiles = (
    files: File[],
    criteria: "name" | "size" | "type" | "lastModified" = "name",
    ascending: boolean = true,
): File[] => {
    const sorted = [...files].sort((a, b) => {
        let comparison = 0;

        switch (criteria) {
            case "name":
                comparison = a.name.localeCompare(b.name);
                break;
            case "size":
                comparison = a.size - b.size;
                break;
            case "type":
                comparison = a.type.localeCompare(b.type);
                break;
            case "lastModified":
                comparison = a.lastModified - b.lastModified;
                break;
        }

        return ascending ? comparison : -comparison;
    });

    return sorted;
};

/**
 * Group files by type for organized processing
 */
export const groupFilesByType = (files: File[]): Record<string, File[]> => {
    const groups: Record<string, File[]> = {};

    files.forEach((file) => {
        const type = file.type || "unknown";
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(file);
    });

    return groups;
};

// ===== Bulk Upload Preparation =====

/**
 * Prepare bulk upload with validation and organization
 */
export const prepareBulkUpload = (
    files: File[],
): {
    isValid: boolean;
    validFiles: File[];
    invalidFiles: Array<{ file: File; error: string }>;
    totalSize: number;
    summary: {
        totalFiles: number;
        validCount: number;
        invalidCount: number;
        totalSizeFormatted: string;
        estimatedTimeMinutes: number;
    };
} => {
    const { valid: validFiles, invalid: invalidFiles } = validateFiles(files);
    const totalSize = calculateTotalSize(validFiles);

    // Estimate upload time (rough calculation based on average upload speed)
    const estimatedTimeMinutes = Math.ceil(
        totalSize /
            (UPLOAD_CONSTANTS.AVERAGE_UPLOAD_SPEED_BYTES_PER_SECOND * 60),
    );

    return {
        isValid: invalidFiles.length === 0,
        validFiles,
        invalidFiles,
        totalSize,
        summary: {
            totalFiles: files.length,
            validCount: validFiles.length,
            invalidCount: invalidFiles.length,
            totalSizeFormatted: formatFileSize(totalSize),
            estimatedTimeMinutes,
        },
    };
};

/**
 * Split files into batches for sequential processing
 */
export const createUploadBatches = (
    files: File[],
    batchSize: number = UPLOAD_CONSTANTS.DEFAULT_BATCH_SIZE,
): File[][] => {
    const batches: File[][] = [];
    for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
    }
    return batches;
};

// ===== Progress Management =====

/**
 * Create upload progress object
 */
export const createUploadProgress = (fileId: string): UploadProgress => ({
    id: fileId,
    progress: 0,
    status: "NOT_UPLOADED",
    error: undefined,
});

/**
 * Calculate overall progress from individual file progresses
 */
export const calculateOverallProgress = (
    progresses: UploadProgress[],
): {
    overallProgress: number;
    completedCount: number;
    failedCount: number;
    processingCount: number;
} => {
    const totalProgress = progresses.reduce(
        (sum, progress) => sum + progress.progress,
        0,
    );
    const overallProgress =
        progresses.length > 0 ? totalProgress / progresses.length : 0;

    const completedCount = progresses.filter((p) =>
        isUploadCompleted(p.status),
    ).length;
    const failedCount = progresses.filter((p) =>
        isUploadFailed(p.status),
    ).length;
    const processingCount = progresses.filter((p) =>
        isUploadProcessing(p.status),
    ).length;

    return {
        overallProgress,
        completedCount,
        failedCount,
        processingCount,
    };
};

/**
 * Calculate upload remaining time estimate
 */
export const calculateUploadTimeRemaining = (
    progress: number,
    startTime: number,
    currentTime: number = Date.now(),
): number | null => {
    if (progress <= 0 || progress >= 100) return null;

    const elapsed = currentTime - startTime;
    const rate = progress / elapsed; // progress per millisecond
    const remaining = (100 - progress) / rate;

    return Math.round(remaining);
};

// ===== Upload Status Helpers =====

/**
 * Check upload status helpers
 */
export const isUploadCompleted = (status: UploadStatus): boolean =>
    status === "COMPLETED";
export const isUploadFailed = (status: UploadStatus): boolean =>
    status === "FAILED";
export const isUploadProcessing = (status: UploadStatus): boolean =>
    status === "PROCESSING" ||
    status === "UPLOADING_STAGE_1" ||
    status === "UPLOADING_STAGE_2";
export const isUploadIdle = (status: UploadStatus): boolean =>
    status === "NOT_UPLOADED";

// ===== Error Handling =====

/**
 * Handle upload error with proper error formatting
 */
export const handleUploadError = (error: unknown): UploadError => {
    if (error instanceof Error) {
        return {
            code: "UPLOAD_FAILED",
            message: error.message,
            details: { originalError: error.name },
        };
    }

    return {
        code: "UPLOAD_FAILED",
        message: "Unknown upload error",
        details: { error: String(error) },
    };
};

/**
 * Aggregate errors from multiple uploads
 */
export const aggregateUploadErrors = (
    errors: UploadError[],
): {
    errorSummary: Record<string, number>;
    mostCommonError: string;
    totalErrors: number;
} => {
    const errorSummary: Record<string, number> = {};

    errors.forEach((error) => {
        const code = error.code || "UNKNOWN";
        errorSummary[code] = (errorSummary[code] || 0) + 1;
    });

    const mostCommonError =
        Object.entries(errorSummary).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "UNKNOWN";

    return {
        errorSummary,
        mostCommonError,
        totalErrors: errors.length,
    };
};

// ===== Queue Management =====

/**
 * Upload queue manager for handling concurrent uploads
 */
export class UploadQueue {
    private queue: Array<{
        file: File;
        userId: string;
        resolve: (result: unknown) => void;
        reject: (error: unknown) => void;
    }> = [];
    private processing = new Set<string>();
    private maxConcurrent: number;
    private onProgress?: (
        fileId: string,
        progress: number,
        status: UploadStatus,
    ) => void;

    constructor(
        maxConcurrent: number = UPLOAD_CONSTANTS.MAX_CONCURRENT_UPLOADS,
        onProgress?: (
            fileId: string,
            progress: number,
            status: UploadStatus,
        ) => void,
    ) {
        this.maxConcurrent = maxConcurrent;
        this.onProgress = onProgress;
    }

    /**
     * Add file to upload queue
     */
    async add(file: File, userId: string): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.queue.push({ file, userId, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Process upload queue with concurrency control
     */
    private async processQueue(): Promise<void> {
        if (
            this.processing.size >= this.maxConcurrent ||
            this.queue.length === 0
        ) {
            return;
        }

        const item = this.queue.shift();
        if (!item) return;

        const fileId = `${item.file.name}-${Date.now()}`;
        this.processing.add(fileId);

        try {
            this.onProgress?.(fileId, 0, "UPLOADING_STAGE_1");

            // Import and use dual storage upload
            const { uploadToDualStorage } = await import("./dualStorageUtils");

            const result = await uploadToDualStorage(
                item.file,
                item.userId,
                (status, progress) => {
                    this.onProgress?.(fileId, progress, status);
                },
            );

            item.resolve(result);
            logInfo("File uploaded successfully", {
                fileId,
                fileName: item.file.name,
            });
        } catch (error) {
            const uploadError = handleUploadError(error);
            item.reject(uploadError);
            logError("File upload failed", {
                fileId,
                fileName: item.file.name,
                error,
            });
        } finally {
            this.processing.delete(fileId);
            // Process next item in queue
            this.processQueue();
        }
    }

    /**
     * Get queue status
     */
    getStatus(): {
        queueLength: number;
        processingCount: number;
        maxConcurrent: number;
    } {
        return {
            queueLength: this.queue.length,
            processingCount: this.processing.size,
            maxConcurrent: this.maxConcurrent,
        };
    }

    /**
     * Clear the upload queue
     */
    clear(): void {
        this.queue.length = 0;
    }
}
