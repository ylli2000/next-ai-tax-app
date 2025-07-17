import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { IMAGE_COMPRESSION, UPLOAD_CONSTANTS } from "@/schema/uploadSchema";

/**
 * Image processing and compression utilities
 * Handles image compression, preview generation, and optimization
 */

/**
 * Compression result interface with detailed statistics
 *
 * Why this approach is better:
 * - Provides transparency: Shows exactly what happened during compression
 * - Enables optimization: Apps can track compression effectiveness
 * - Supports user feedback: Can show compression savings to users
 * - Debugging friendly: Easy to identify compression issues
 */
interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number; // Percentage reduction (0-100)
    attempts: number; // How many compression iterations were needed
    finalQuality: number; // Final quality setting used (0.0-1.0)
}

// ===== Internal Helper Functions =====

/**
 * Calculate optimal dimensions considering target file size
 *
 * Smart sizing algorithm:
 * 1. First applies max width/height constraints while preserving aspect ratio
 * 2. For small target sizes (<50% of default), pre-reduces dimensions to prevent excessive quality loss
 * 3. Uses square root scaling to balance dimension reduction with quality preservation
 *
 * Why square root scaling?
 * - Image file size roughly correlates with pixel count (width × height)
 * - sqrt(targetSize/referenceSize) gives proportional dimension scaling
 * - Prevents over-aggressive dimension reduction that destroys image quality
 */
const calculateOptimalDimensions = (
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    targetSizeBytes?: number,
): { width: number; height: number } => {
    // First, apply max width/height constraints
    let { width, height } = calculateAspectRatioFit(
        originalWidth,
        originalHeight,
        maxWidth,
        maxHeight,
    );

    // If target size is small, reduce dimensions further
    if (targetSizeBytes) {
        // Use 50% of configured target size as threshold for dimension reduction
        const dimensionReductionThreshold =
            UPLOAD_CONSTANTS.TARGET_COMPRESSED_FILE_SIZE_IN_BYTES * 0.5;
        if (targetSizeBytes < dimensionReductionThreshold) {
            const sizeFactor = Math.sqrt(
                targetSizeBytes / dimensionReductionThreshold,
            );
            width = Math.floor(width * sizeFactor);
            height = Math.floor(height * sizeFactor);
        }
    }

    return { width, height };
};

/**
 * Calculate aspect ratio fit dimensions
 */
const calculateAspectRatioFit = (
    srcWidth: number,
    srcHeight: number,
    maxWidth: number,
    maxHeight: number,
): { width: number; height: number } => {
    if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
        return { width: srcWidth, height: srcHeight };
    }

    const aspectRatio = srcWidth / srcHeight;

    if (srcWidth > srcHeight) {
        return {
            width: Math.min(srcWidth, maxWidth),
            height: Math.min(srcWidth, maxWidth) / aspectRatio,
        };
    } else {
        return {
            width: Math.min(srcHeight, maxHeight) * aspectRatio,
            height: Math.min(srcHeight, maxHeight),
        };
    }
};

// ===== Image Compression =====

/**
 * Compress image file for upload optimization with progressive compression
 *
 * Advanced compression algorithm advantages:
 * 1. **Progressive Quality Reduction**: Starts with high quality, reduces iteratively
 * 2. **Target Size Control**: Automatically achieves desired file size
 * 3. **Smart Dimension Scaling**: Pre-reduces dimensions for small targets
 * 4. **Detailed Statistics**: Returns compression metrics for optimization
 * 5. **Failure Resilience**: Graceful fallback if target size isn't achievable
 *
 * How it works:
 * - Uses HTML5 Canvas for client-side compression (no server round-trip)
 * - Applies dimension constraints first, then iteratively reduces quality
 * - Each iteration reduces quality by 20% until target size or max attempts reached
 * - Returns comprehensive statistics for debugging and user feedback
 *
 * Usage Examples:
 * ```typescript
 * // Basic compression with size limit
 * const result = await compressImage(file, {targetSizeBytes: 500 * 1024}); // 500KB target
 * console.log(`Reduced from ${result.originalSize} to ${result.compressedSize} bytes`);
 * console.log(`Compression ratio: ${result.compressionRatio}%`);
 *
 * // Custom compression settings
 * const result = await compressImage(file, {
 *   targetSizeBytes: 200 * 1024,
 *   maxWidth: 1200,
 *   maxHeight: 800,
 *   quality: 0.9,
 *   outputFormat: 'image/jpeg',
 *   maxAttempts: 3
 * });
 *
 * // Show compression feedback to user
 * if (result.compressionRatio > 50) {
 *   showMessage(`Great! Reduced file size by ${result.compressionRatio}%`);
 * }
 * ```
 */
export const compressImage = async (
    file: File,
    options: {
        targetSizeBytes?: number;
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        outputFormat?: string;
        maxAttempts?: number;
    } = {},
): Promise<CompressionResult> => {
    const {
        maxWidth = IMAGE_COMPRESSION.DEFAULT_MAX_WIDTH,
        maxHeight = IMAGE_COMPRESSION.DEFAULT_MAX_HEIGHT,
        quality = IMAGE_COMPRESSION.DEFAULT_QUALITY,
        outputFormat = IMAGE_COMPRESSION.DEFAULT_OUTPUT_FORMAT,
        maxAttempts = 5,
    } = options;

    return new Promise<CompressionResult>((resolve, reject) => {
        const img = new Image();
        let currentAttempt = 0;
        let currentQuality = quality;

        const performCompression = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(
                    new Error(ERROR_MESSAGES.CANVAS_2D_CONTEXT_NOT_SUPPORTED),
                );
                return;
            }

            // Calculate optimal dimensions
            const { width, height } = calculateOptimalDimensions(
                img.width,
                img.height,
                maxWidth,
                maxHeight,
                options.targetSizeBytes,
            );

            canvas.width = width;
            canvas.height = height;

            // Apply image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(
                            new Error(ERROR_MESSAGES.FAILED_TO_COMPRESS_IMAGE),
                        );
                        return;
                    }
                    currentAttempt++;
                    // Check if target size is met or max attempts reached
                    if (
                        !options.targetSizeBytes ||
                        blob.size <= options.targetSizeBytes ||
                        currentAttempt >= maxAttempts
                    ) {
                        const compressedFile = new File([blob], file.name, {
                            type: outputFormat,
                            lastModified: Date.now(),
                        });

                        const result: CompressionResult = {
                            file: compressedFile,
                            originalSize: file.size,
                            compressedSize: blob.size,
                            compressionRatio:
                                ((file.size - blob.size) / file.size) * 100,
                            attempts: currentAttempt,
                            finalQuality: currentQuality,
                        };
                        resolve(result); //final result
                    } else {
                        // Progressive compression: reduce quality and retry
                        currentQuality = Math.max(
                            0.1,
                            currentQuality *
                                IMAGE_COMPRESSION.QUALITY_REDUCTION_FACTOR,
                        );
                        performCompression(); //keep looping
                    }
                },
                outputFormat,
                currentQuality,
            );
        };

        img.onload = performCompression;
        img.onerror = () =>
            reject(new Error(ERROR_MESSAGES.FAILED_TO_LOAD_IMAGE));
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Standardized image compression interface for client upload workflow
 * Provides consistent return format expected by upload utilities
 */
export const compressImageWithStandardInterface = async (
    file: File,
    options: {
        targetSizeBytes?: number;
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        outputFormat?: string;
        maxAttempts?: number;
    } = {},
): Promise<{
    success: boolean;
    compressedFile?: File;
    error?: string;
    compressionStats?: {
        originalSize: number;
        compressedSize: number;
        compressionRatio: number;
        attempts: number;
        finalQuality: number;
    };
}> => {
    try {
        const compressionResult = await compressImage(file, options);

        return {
            success: true,
            compressedFile: compressionResult.file,
            compressionStats: {
                originalSize: compressionResult.originalSize,
                compressedSize: compressionResult.compressedSize,
                compressionRatio: compressionResult.compressionRatio,
                attempts: compressionResult.attempts,
                finalQuality: compressionResult.finalQuality,
            },
        };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : ERROR_MESSAGES.FAILED_TO_COMPRESS_IMAGE,
        };
    }
};

// ===== Preview Generation =====

/**
 * Generate file preview URL for upload interface
 */
export const createPreviewUrl = (file: File): string =>
    URL.createObjectURL(file);

/**
 * Revoke file preview URL to prevent memory leaks
 */
export const revokePreviewUrl = (url: string): void => {
    URL.revokeObjectURL(url);
};
