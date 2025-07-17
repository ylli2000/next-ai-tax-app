import {
    IMAGE_COMPRESSION,
    UPLOAD_CONSTANTS,
    type UploadStatus,
} from "@/schema/uploadSchema";
import { PDF_PROCESSING } from "@/schema/pdfSchema";
import { type ExtractedInvoiceData } from "@/schema/aiSchema";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/sys/log";
import { validateFile } from "@/utils/core/file";
import { compressImageWithStandardInterface } from "@/services/file/image";
import {
    smartPdfProcessing,
    shouldProcessAsPdf,
    supportsPdfProcessing,
} from "@/services/file/pdf";

/**
 * Client-side upload coordination utilities
 * Orchestrates the complete file upload workflow on the client side
 */

export interface UploadResult {
    success: boolean;
    fileId?: string;
    extractedData?: ExtractedInvoiceData;
    s3ObjectKey?: string;
    pageCount?: number;
    processedPages?: number;
    processingStrategy?: string;
    error?: string;
}

export interface UploadProgressCallback {
    (status: UploadStatus, progress: number, message?: string): void;
}

/**
 * Main client-side file upload workflow
 * Handles PDF conversion, image compression, S3 upload, and AI processing coordination
 */
export const handleFileUpload = async (
    file: File,
    userId: string,
    onProgressUpdate: UploadProgressCallback,
    options: {
        maxPages?: number;
    } = {},
): Promise<UploadResult> => {
    try {
        onProgressUpdate("NOT_UPLOADED", 0, "Starting upload...");

        // Step 1: Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error,
            };
        }

        let processedFile = file;
        let pdfProcessingInfo: {
            pageCount?: number;
            processedPages?: number;
            strategy?: string;
        } = {};

        // Step 2: Handle PDF conversion if needed
        if (shouldProcessAsPdf(file)) {
            if (!supportsPdfProcessing()) {
                return {
                    success: false,
                    error: "PDF processing not supported in this browser. Please convert to image first.",
                };
            }

            onProgressUpdate(
                "PROCESSING_PDF",
                10,
                SUCCESS_MESSAGES.PDF_PROCESSING_STARTED,
            );

            const { maxPages = PDF_PROCESSING.MAX_READ_PDF_PAGES } = options;

            const pdfResult = await smartPdfProcessing(file, {
                maxPages,
                scale: 2.0,
                outputFormat: "image/jpeg",
                quality: 0.9,
                maxWidth: 1920,
                maxHeight: 1080,
                pageSpacing: 20,
                addPageSeparator: true,
            });

            if (!pdfResult.success || !pdfResult.imageFile) {
                return {
                    success: false,
                    error:
                        pdfResult.error || ERROR_MESSAGES.PDF_PROCESSING_FAILED,
                };
            }

            processedFile = pdfResult.imageFile;

            // Save PDF processing information
            pdfProcessingInfo = {
                pageCount: pdfResult.pageCount,
                processedPages: pdfResult.processedPages,
                strategy: pdfResult.strategy,
            };

            onProgressUpdate(
                "PROCESSING_PDF",
                20,
                SUCCESS_MESSAGES.PDF_PROCESSING_COMPLETED,
            );

            logInfo("PDF converted to image successfully", {
                originalFileName: file.name,
                originalSize: file.size,
                convertedFileName: processedFile.name,
                convertedSize: processedFile.size,
                pageCount: pdfResult.pageCount,
                processedPages: pdfResult.processedPages,
                selectedPage: pdfResult.selectedPage,
                strategy: pdfResult.strategy,
                totalHeight: pdfResult.totalHeight,
            });
        }

        // Step 3: Image compression with smart scaling
        onProgressUpdate(
            "COMPRESSING_IMAGE",
            25,
            SUCCESS_MESSAGES.IMAGE_COMPRESSION_STARTED,
        );

        // Calculate smart compression parameters based on PDF processing
        const isLongImage =
            pdfProcessingInfo.strategy?.startsWith("long-image");
        const pageCount = pdfProcessingInfo.processedPages || 1;

        // Scale parameters for long images
        const targetSizeBytes = isLongImage
            ? UPLOAD_CONSTANTS.TARGET_COMPRESSED_FILE_SIZE_IN_BYTES * pageCount
            : UPLOAD_CONSTANTS.TARGET_COMPRESSED_FILE_SIZE_IN_BYTES;

        const maxHeight = isLongImage
            ? IMAGE_COMPRESSION.DEFAULT_MAX_HEIGHT * pageCount
            : IMAGE_COMPRESSION.DEFAULT_MAX_HEIGHT;

        const compressionResult = await compressImageWithStandardInterface(
            processedFile,
            {
                targetSizeBytes,
                maxWidth: IMAGE_COMPRESSION.DEFAULT_MAX_WIDTH,
                maxHeight,
                quality: IMAGE_COMPRESSION.DEFAULT_QUALITY,
                outputFormat: IMAGE_COMPRESSION.DEFAULT_OUTPUT_FORMAT,
            },
        );

        if (!compressionResult.success || !compressionResult.compressedFile) {
            return {
                success: false,
                error:
                    compressionResult.error ||
                    ERROR_MESSAGES.IMAGE_COMPRESSION_FAILED,
            };
        }

        processedFile = compressionResult.compressedFile;
        onProgressUpdate(
            "COMPRESSING_IMAGE",
            35,
            SUCCESS_MESSAGES.IMAGE_COMPRESSION_COMPLETED,
        );

        logInfo("Image compressed successfully", {
            originalSize: file.size,
            compressedSize: processedFile.size,
            compressionRatio:
                (((file.size - processedFile.size) / file.size) * 100).toFixed(
                    1,
                ) + "%",
            isLongImage,
            pageCount,
            targetSizeBytes,
            maxHeight,
            compressionStats: compressionResult.compressionStats,
        });

        // Step 4: Request S3 upload URL
        onProgressUpdate(
            "UPLOADING_TO_S3",
            40,
            "Preparing upload to cloud storage...",
        );

        const uploadUrlResult = await requestS3UploadUrl(processedFile, userId);
        if (!uploadUrlResult.success) {
            return {
                success: false,
                error: uploadUrlResult.error,
            };
        }

        // Step 5: Upload directly to S3
        onProgressUpdate(
            "UPLOADING_TO_S3",
            45,
            SUCCESS_MESSAGES.S3_UPLOAD_STARTED,
        );

        const uploadResult = await uploadToS3Direct(
            processedFile,
            uploadUrlResult.presignedUrl!,
            (progress) => {
                // Progress range: 45-70% for S3 upload
                const mappedProgress = 45 + progress * 0.25;
                onProgressUpdate(
                    "UPLOADING_TO_S3",
                    mappedProgress,
                    "Uploading to cloud storage...",
                );
            },
        );

        if (!uploadResult.success) {
            return {
                success: false,
                error: uploadResult.error,
            };
        }

        onProgressUpdate(
            "UPLOADING_TO_S3",
            70,
            SUCCESS_MESSAGES.S3_UPLOAD_COMPLETED,
        );

        // Step 6: Request AI processing
        onProgressUpdate("AI_PROCESSING", 75, "Starting AI analysis...");

        const aiResult = await requestAIProcessing(
            uploadUrlResult.s3ObjectKey!,
            userId,
            (progress) => {
                // Progress range: 75-100% for AI processing
                const mappedProgress = 75 + progress * 0.25;
                onProgressUpdate(
                    "AI_PROCESSING",
                    mappedProgress,
                    "AI analyzing your invoice...",
                );
            },
        );

        if (!aiResult.success) {
            return {
                success: false,
                error: aiResult.error,
            };
        }

        onProgressUpdate(
            "COMPLETED",
            100,
            "Upload and analysis completed successfully!",
        );

        logInfo("Complete file upload workflow finished successfully", {
            originalFileName: file.name,
            finalFileName: processedFile.name,
            s3ObjectKey: uploadUrlResult.s3ObjectKey,
            fileId: aiResult.fileId,
            extractedData: aiResult.extractedData,
        });

        return {
            success: true,
            fileId: aiResult.fileId,
            extractedData: aiResult.extractedData,
            s3ObjectKey: uploadUrlResult.s3ObjectKey,
            pageCount: pdfProcessingInfo.pageCount,
            processedPages: pdfProcessingInfo.processedPages,
            processingStrategy: pdfProcessingInfo.strategy,
        };
    } catch (error) {
        logError("File upload workflow failed", {
            error,
            fileName: file.name,
            userId,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.UPLOAD_FAILED,
        };
    }
};

/**
 * Request S3 pre-signed upload URL from server
 */
const requestS3UploadUrl = async (
    file: File,
    userId: string,
): Promise<{
    success: boolean;
    presignedUrl?: string;
    s3ObjectKey?: string;
    error?: string;
}> => {
    try {
        const response = await fetch("/api/files/request-upload-url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fileName: file.name,
                contentType: file.type,
                fileSize: file.size,
                userId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            presignedUrl: data.presignedUrl,
            s3ObjectKey: data.s3ObjectKey,
        };
    } catch (error) {
        logError("Failed to request S3 upload URL", {
            error,
            fileName: file.name,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_DIRECT_UPLOAD_FAILED,
        };
    }
};

/**
 * Upload file directly to S3 using pre-signed URL
 */
const uploadToS3Direct = async (
    file: File,
    presignedUrl: string,
    onProgress?: (progress: number) => void,
): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Progress tracking
            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            });

            // Success handling
            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({ success: true });
                } else {
                    reject(new Error(`S3 upload failed: HTTP ${xhr.status}`));
                }
            });

            // Error handling
            xhr.addEventListener("error", () => {
                reject(new Error("Network error during S3 upload"));
            });

            xhr.addEventListener("timeout", () => {
                reject(new Error("S3 upload timed out"));
            });

            // Configure and send request
            xhr.open("PUT", presignedUrl);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.timeout = 5 * 60 * 1000; // 5 minutes timeout
            xhr.send(file);
        });
    } catch (error) {
        logError("S3 direct upload failed", { error, fileName: file.name });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_DIRECT_UPLOAD_FAILED,
        };
    }
};

/**
 * Request AI processing of uploaded file
 */
const requestAIProcessing = async (
    s3ObjectKey: string,
    userId: string,
    onProgress?: (progress: number) => void,
): Promise<{
    success: boolean;
    fileId?: string;
    extractedData?: ExtractedInvoiceData;
    error?: string;
}> => {
    try {
        onProgress?.(10);

        const response = await fetch("/api/files/process-with-ai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                s3ObjectKey,
                userId,
            }),
        });

        onProgress?.(50);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        onProgress?.(100);

        return {
            success: true,
            fileId: data.fileId,
            extractedData: data.extractedData,
        };
    } catch (error) {
        logError("AI processing request failed", { error, s3ObjectKey });
        return {
            success: false,
            error: ERROR_MESSAGES.AI_PROCESSING_FAILED,
        };
    }
};

/**
 * Batch upload multiple files with parallel processing
 * Each file uses the complete single-file workflow independently
 */
export const handleBatchFileUpload = async (
    files: File[],
    userId: string,
    onFileProgress: (
        fileIndex: number,
        status: UploadStatus,
        progress: number,
        message?: string,
    ) => void,
    onOverallProgress: (completed: number, total: number) => void,
    options: {
        maxPages?: number;
    } = {},
): Promise<{
    results: UploadResult[];
    successCount: number;
    failureCount: number;
}> => {
    const results: UploadResult[] = [];
    let completedCount = 0;

    // Process files in parallel with limited concurrency
    const CONCURRENT_UPLOADS = 3;
    const chunks = [];
    for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
        chunks.push(files.slice(i, i + CONCURRENT_UPLOADS));
    }

    for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (file, chunkIndex) => {
            const fileIndex = results.length + chunkIndex;

            try {
                const result = await handleFileUpload(
                    file,
                    userId,
                    (status, progress, message) => {
                        onFileProgress(fileIndex, status, progress, message);
                    },
                    options,
                );

                completedCount++;
                onOverallProgress(completedCount, files.length);

                return result;
            } catch (error) {
                completedCount++;
                onOverallProgress(completedCount, files.length);

                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : ERROR_MESSAGES.UPLOAD_FAILED,
                };
            }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    logInfo("Batch upload completed", {
        totalFiles: files.length,
        successCount,
        failureCount,
        concurrentUploads: CONCURRENT_UPLOADS,
    });

    return {
        results,
        successCount,
        failureCount,
    };
};
