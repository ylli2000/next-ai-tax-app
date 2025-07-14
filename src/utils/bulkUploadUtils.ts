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
} from "./uploadStatusUtils";
import { formatFileSize } from "./formatUtils";
import { validateFiles } from "./fileUtils";

/**
 * 前端多文件上传工具函数
 *
 * ⚠️ 重要说明：
 * 这些工具函数用于前端多文件上传界面的显示和管理。
 * 实际的上传流程：每个文件都是独立的单文件上传，使用 dualStorageUtils.ts 的工作流。
 *
 * 前端"批量上传" = 多个独立的单文件上传并行执行
 * - 每个文件有独立的上传状态和进度
 * - 每个文件使用独立的 pre-signed URL
 * - 失败的文件不影响其他文件
 * - 前端组件负责协调多个并行上传的显示
 *
 * 工作流程：
 * 1. 用户选择多个文件
 * 2. 前端使用这些工具函数验证和组织文件
 * 3. 前端并行执行多个独立的单文件上传（每个都调用 dualStorageUtils 工作流）
 * 4. 前端使用这些工具函数汇总和显示整体进度
 */

// ===== 前端文件组织工具 =====

/**
 * 前端工具：计算多个文件的总大小
 * 用于前端显示总上传大小和估算时间
 */
export const calculateTotalSize = (files: File[]): number =>
    files.reduce((total, file) => total + file.size, 0);

/**
 * 前端工具：文件排序
 * 用于前端文件列表的排序显示
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
 * 前端工具：按类型分组文件
 * 用于前端按文件类型分类显示
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

// ===== 前端批量上传准备工具 =====

/**
 * 前端工具：准备多文件上传
 *
 * 注意：这只是前端的文件验证和统计，实际上传时每个文件都是独立的单文件上传流程
 * 使用 dualStorageUtils.ts 的 initiateDualStorageWorkflow + confirmUploadAndProcessAI
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

    // 估算上传时间（基于平均上传速度的粗略计算）
    // 注意：实际时间取决于网络状况和每个文件的独立上传进度
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

// ===== 前端进度管理工具 =====

/**
 * 前端工具：创建单个文件的上传进度对象
 * 用于前端初始化每个文件的上传状态
 */
export const createUploadProgress = (fileId: string): UploadProgress => ({
    id: fileId,
    progress: 0,
    status: "NOT_UPLOADED",
    error: undefined,
});

/**
 * 前端工具：计算多文件上传的整体进度
 *
 * 基于多个独立的单文件上传进度计算整体进度
 * 每个文件都有自己的上传状态，这个函数用于前端显示整体进度条
 *
 * 使用 uploadStatusUtils.ts 的状态检查函数确保一致性
 */
export const calculateOverallProgress = (
    progresses: UploadProgress[],
): {
    overallProgress: number;
    completedCount: number;
    failedCount: number;
    processingCount: number;
    idleCount: number;
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

    return {
        overallProgress,
        completedCount,
        failedCount,
        processingCount,
        idleCount,
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
 * 这个示例展示了如何在前端使用这些工具函数配合 dualStorageUtils.ts 实现多文件上传：
 *
 * ```typescript
 * import { initiateDualStorageWorkflow, confirmUploadAndProcessAI } from './dualStorageUtils';
 *
 * const uploadMultipleFiles = async (files: File[], userId: string) => {
 *   // 1. 前端验证和准备
 *   const { validFiles, invalidFiles } = prepareBulkUpload(files);
 *
 *   // 2. 为每个文件创建进度对象
 *   const progresses = validFiles.map(file =>
 *     createUploadProgress(`${file.name}-${Date.now()}`)
 *   );
 *
 *   // 3. 并行执行独立的单文件上传
 *   const uploadPromises = validFiles.map(async (file, index) => {
 *     try {
 *       // 每个文件都是完整的单文件上传流程
 *
 *       // 步骤1: 初始化上传会话
 *       const initResult = await initiateDualStorageWorkflow(
 *         file,
 *         userId,
 *         (status, progress) => {
 *           progresses[index] = { ...progresses[index], status, progress };
 *           updateUI(); // 更新前端显示
 *         }
 *       );
 *
 *       // 步骤2: 前端直接上传到S3
 *       await uploadFileToS3(file, initResult.presignedUploadUrl);
 *
 *       // 步骤3: 确认上传并AI处理
 *       const confirmResult = await confirmUploadAndProcessAI(
 *         initResult.uploadSessionId,
 *         (status, progress) => {
 *           progresses[index] = { ...progresses[index], status, progress };
 *           updateUI(); // 更新前端显示
 *         }
 *       );
 *
 *       return confirmResult;
 *     } catch (error) {
 *       const uploadError = handleUploadError(error);
 *       progresses[index] = {
 *         ...progresses[index],
 *         status: 'FAILED',
 *         error: uploadError.message
 *       };
 *       updateUI();
 *       throw uploadError;
 *     }
 *   });
 *
 *   // 4. 等待所有上传完成（允许部分失败）
 *   const results = await Promise.allSettled(uploadPromises);
 *
 *   // 5. 汇总结果
 *   const overallProgress = calculateOverallProgress(progresses);
 *   const errors = results
 *     .filter(r => r.status === 'rejected')
 *     .map(r => handleUploadError(r.reason));
 *   const errorSummary = aggregateUploadErrors(errors);
 *
 *   return { overallProgress, errors, errorSummary };
 * };
 * ```
 */
export const FRONTEND_PARALLEL_UPLOAD_EXAMPLE = {
    description:
        "See the comment above for frontend parallel upload workflow example",
    note: "Each file uses the complete single-file upload workflow from dualStorageUtils.ts",
} as const;
