import {
    UPLOAD_CONSTANTS,
    type UploadError,
    type UploadProgress,
} from "@/schema/uploadSchema";
import {
    isUploadCompleted,
    isUploadFailed,
    isUploadProcessing,
    isUploadIdle,
    isProcessingPdf,
    isCompressingImage,
    isUploadingToS3,
    isAIProcessing,
} from "@/services/upload/status";
import { formatFileSize } from "@/utils/core/format";
import { validateFiles } from "@/utils/core/file";

/**
 * Frontend multi-file upload utility functions
 *
 * ⚠️ Important Note:
 * These utility functions are used for frontend multi-file upload interface display and management.
 * Actual upload process: Each file is an independent single-file upload using the new workflow from clientUploadUtils.ts.
 *
 * Frontend "bulk upload" = Multiple independent single-file uploads executed in parallel
 * - Each file has independent upload status and progress (6 status enums)
 * - Each file uploads directly to S3 (no OpenAI Files transfer needed)
 * - Failed files do not affect other files
 * - Frontend components coordinate the display of multiple parallel uploads
 *
 * New workflow:
 * 1. User selects multiple files
 * 2. Frontend uses these utility functions to validate and organize files
 * 3. Frontend executes multiple independent single-file uploads in parallel (each calls clientUploadUtils workflow)
 * 4. Frontend uses these utility functions to aggregate and display overall progress
 */

// ===== Frontend File Organization Tools =====

/**
 * Frontend tool: Calculate total size of multiple files
 * Used for frontend display of total upload size and time estimation
 */
export const calculateTotalSize = (files: File[]): number =>
    files.reduce((total, file) => total + file.size, 0);

/**
 * Frontend tool: File sorting
 * Used for sorting display of frontend file list
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
 * Frontend tool: Group files by type
 * Used for categorized display by file type on frontend
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

// ===== Frontend Bulk Upload Preparation Tools =====

/**
 * Frontend tool: Prepare multi-file upload
 *
 * Note: This is only frontend file validation and statistics, actual upload uses independent single-file upload process for each file
 * Uses handleFileUpload function from clientUploadUtils.ts for complete client-side coordinated upload
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
    // Note: Actual time depends on network conditions and independent upload progress of each file
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

// ===== Frontend Progress Management Tools =====

/**
 * Frontend tool: Create upload progress object for single file
 * Used for frontend initialization of each file's upload status
 */
export const createUploadProgress = (fileId: string): UploadProgress => ({
    id: fileId,
    progress: 0,
    status: "NOT_UPLOADED",
    error: undefined,
});

/**
 * Frontend tool: Calculate overall progress of multi-file upload
 *
 * Calculates overall progress based on multiple independent single-file upload progresses
 * Each file has its own upload status, this function is used for frontend overall progress bar display
 *
 * Uses status check functions from uploadStatusUtils.ts to ensure consistency
 */
export const calculateOverallProgress = (
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
    const idleCount = progresses.filter((p) => isUploadIdle(p.status)).length;

    // New detailed status counts for 6-state workflow
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

/**
 * 前端工具：计算剩余时间估算
 * 用于前端显示预计剩余时间
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

// ===== 前端错误处理工具 =====

/**
 * 前端工具：格式化单个上传错误
 * 用于前端统一错误显示格式
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
 * 前端工具：汇总多个上传错误
 * 用于前端显示错误统计和最常见的错误类型
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

// ===== 前端并行上传工作流示例 =====

/**
 * 前端并行上传工作流示例
 *
 * 这个示例展示了如何在前端使用这些工具函数配合 clientUploadUtils.ts 实现多文件上传：
 *
 * ```typescript
 * import { handleFileUpload, handleBatchFileUpload } from './clientUploadUtils';
 *
 * const uploadMultipleFiles = async (files: File[], userId: string) => {
 *   // 1. 前端验证和准备
 *   const { validFiles, invalidFiles } = prepareBulkUpload(files);
 *
 *   // 2. 使用新的批量上传函数（每个文件独立的完整工作流）
 *   const batchResult = await handleBatchFileUpload(
 *     validFiles,
 *     userId,
 *     (fileIndex, status, progress, message) => {
 *       // 更新单个文件的进度显示
 *       updateFileProgress(fileIndex, status, progress, message);
 *     },
 *     (completed, total) => {
 *       // 更新整体进度显示
 *       updateOverallProgress(completed, total);
 *     }
 *   );
 *
 *   // 3. 处理结果
 *   const { results, successCount, failureCount } = batchResult;
 *
 *   // 4. 显示最终结果
 *   console.log(`Upload completed: ${successCount} success, ${failureCount} failed`);
 *
 *   return batchResult;
 * };
 *
 * // 或者手动控制每个文件的上传
 * const uploadFilesManually = async (files: File[], userId: string) => {
 *   const results = [];
 *
 *   for (const [index, file] of files.entries()) {
 *     try {
 *       const result = await handleFileUpload(
 *         file,
 *         userId,
 *         (status, progress, message) => {
 *           updateFileProgress(index, status, progress, message);
 *         }
 *       );
 *       results.push(result);
 *     } catch (error) {
 *       results.push({ success: false, error: error.message });
 *     }
 *   }
 *
 *   return results;
 * };
 * ```
 */
export const FRONTEND_PARALLEL_UPLOAD_EXAMPLE = {
    description:
        "See the comment above for frontend parallel upload workflow example",
    note: "Each file uses the complete single-file upload workflow from clientUploadUtils.ts with 6-state progress tracking",
} as const;
