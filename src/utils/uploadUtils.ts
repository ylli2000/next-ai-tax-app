import { ERROR_MESSAGES } from "@/schema/messageSchema";
import {
    UPLOAD_CONSTANTS,
    type UploadError,
    type UploadProgress,
    type UploadStatus,
} from "@/schema/uploadSchema";
import { formatFileSize } from "./formatUtils";
import { logError } from "./logUtils";

export const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex >= 0 ? filename.slice(lastDotIndex) : "";
};

export const getFileNameWithoutExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex >= 0 ? filename.slice(0, lastDotIndex) : filename;
};

export const isImageFile = (file: File | string): boolean => {
    if (typeof file === "string") {
        const extension = getFileExtension(file).toLowerCase();
        return (
            UPLOAD_CONSTANTS.IMAGE_EXTENSIONS as readonly string[]
        ).includes(extension);
    }
    return (UPLOAD_CONSTANTS.IMAGE_MIME_TYPES as readonly string[]).includes(
        file.type,
    );
};

export const isPdfFile = (file: File | string): boolean => {
    if (typeof file === "string") {
        const extension = getFileExtension(file).toLowerCase();
        return (UPLOAD_CONSTANTS.PDF_EXTENSIONS as readonly string[]).includes(
            extension,
        );
    }
    return (UPLOAD_CONSTANTS.PDF_MIME_TYPES as readonly string[]).includes(
        file.type,
    );
};

export const validateFile = (
    file: File,
): {
    isValid: boolean;
    error?: string;
} => {
    // Check file size
    if (file.size > UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: `${ERROR_MESSAGES.FILE_TOO_LARGE} (${formatFileSize(file.size)})`,
        };
    }
    // Check file type
    if (
        !(UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES as readonly string[]).includes(
            file.type,
        )
    ) {
        return {
            isValid: false,
            error: ERROR_MESSAGES.INVALID_FILE_TYPE,
        };
    }
    // Check file extension
    const extension = getFileExtension(file.name).toLowerCase();
    if (
        !(UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS as readonly string[]).includes(
            extension,
        )
    ) {
        return {
            isValid: false,
            error: ERROR_MESSAGES.INVALID_FILE_TYPE,
        };
    }
    return { isValid: true };
};
// Batch validate multiple files
export const validateFiles = (
    files: File[],
): {
    valid: File[];
    invalid: Array<{ file: File; error: string }>;
} => {
    const valid: File[] = [];
    const invalid: Array<{ file: File; error: string }> = [];

    files.forEach((file) => {
        const validation = validateFile(file);
        if (validation.isValid) {
            valid.push(file);
        } else {
            invalid.push({
                file,
                error: validation.error || ERROR_MESSAGES.UNKNOWN_ERROR,
            });
        }
    });
    return { valid, invalid };
};
// Convert file to base64 string (for upload preprocessing)
export const fileToBase64 = async (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (data:image/jpeg;base64,)
            const base64 = result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });

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

/**
 * Calculate optimal dimensions considering target file size
 *
 * Smart sizing algorithm:
 * 1. First applies max width/height constraints while preserving aspect ratio
 * 2. For small target sizes (<500KB), pre-reduces dimensions to prevent excessive quality loss
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
    if (targetSizeBytes && targetSizeBytes < 500 * 1024) {
        // 500KB threshold - below this, pre-reduce dimensions
        const sizeFactor = Math.sqrt(targetSizeBytes / (500 * 1024));
        width = Math.floor(width * sizeFactor);
        height = Math.floor(height * sizeFactor);
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
 * const result = await compressImage(file, 500 * 1024); // 500KB target
 * console.log(`Reduced from ${result.originalSize} to ${result.compressedSize} bytes`);
 * console.log(`Compression ratio: ${result.compressionRatio}%`);
 *
 * // Custom compression settings
 * const result = await compressImage(file, 200 * 1024, {
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
    targetSizeBytes?: number,
    options: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        outputFormat?: string;
        maxAttempts?: number;
    } = {},
): Promise<CompressionResult> => {
    const {
        maxWidth = UPLOAD_CONSTANTS.IMAGE_COMPRESSION.DEFAULT_MAX_WIDTH,
        maxHeight = UPLOAD_CONSTANTS.IMAGE_COMPRESSION.DEFAULT_MAX_HEIGHT,
        quality = UPLOAD_CONSTANTS.IMAGE_COMPRESSION.DEFAULT_QUALITY,
        outputFormat = UPLOAD_CONSTANTS.IMAGE_COMPRESSION.DEFAULT_OUTPUT_FORMAT,
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
                reject(new Error("Canvas 2D context not supported"));
                return;
            }

            // Calculate optimal dimensions
            const { width, height } = calculateOptimalDimensions(
                img.width,
                img.height,
                maxWidth,
                maxHeight,
                targetSizeBytes,
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
                        !targetSizeBytes ||
                        blob.size <= targetSizeBytes ||
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

                        resolve(result);
                    } else {
                        // Progressive compression: reduce quality and retry
                        currentQuality = Math.max(0.1, currentQuality * 0.8);
                        performCompression();
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

/**
 * Generate unique filename for upload
 */
export const generateUniqueFilename = (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = getFileExtension(originalName);
    const nameWithoutExt = getFileNameWithoutExtension(originalName);

    return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
};

/**
 * Sanitize filename for safe storage
 */
export const sanitizeFilename = (filename: string): string =>
    // Remove or replace unsafe characters
    filename
        .replace(UPLOAD_CONSTANTS.UNSAFE_FILENAME_CHARS, "_") // Replace unsafe characters with underscore
        .replace(/\s+/g, "_") // Replace spaces with underscore
        .replace(/_{2,}/g, "_") // Replace multiple underscores with single
        .trim()
        .substring(0, UPLOAD_CONSTANTS.MAX_FILENAME_LENGTH); // Limit length to max filename length

/**
 * Check if browser supports file reading
 */
export const supportsFileReader = (): boolean =>
    typeof FileReader !== "undefined";

/**
 * Check if browser supports drag and drop
 */
export const supportsDragAndDrop = (): boolean => {
    const div = document.createElement("div");
    return "draggable" in div || ("ondragstart" in div && "ondrop" in div);
};

/**
 * Get file metadata for upload interface display
 */
export const getFileMetadata = (
    file: File,
): {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    extension: string;
    sizeFormatted: string;
    isImage: boolean;
    isPdf: boolean;
} => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    extension: getFileExtension(file.name),
    sizeFormatted: formatFileSize(file.size),
    isImage: isImageFile(file),
    isPdf: isPdfFile(file),
});

/**
 * Read file from input element
 */
export const readFileFromInput = async (
    input: HTMLInputElement,
): Promise<File[]> =>
    new Promise((resolve, reject) => {
        if (!input.files) {
            reject(new Error(ERROR_MESSAGES.NO_FILES_SELECTED));
            return;
        }

        const files = Array.from(input.files);
        resolve(files);
    });

/**
 * Create file input element for upload interface
 */
export const createFileInput = (
    options: {
        accept?: string;
        multiple?: boolean;
        onChange?: (files: File[]) => void;
    } = {},
): HTMLInputElement => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
        options.accept || UPLOAD_CONSTANTS.DEFAULT_ALLOWED_TYPES_STRING;
    input.multiple = options.multiple || false;
    input.style.display = "none";

    if (options.onChange) {
        input.addEventListener("change", async () => {
            try {
                const files = await readFileFromInput(input);
                options.onChange!(files);
            } catch (error) {
                logError("Error reading files:", error);
            }
        });
    }

    return input;
};

/**
 * Trigger file selection dialog
 */
export const selectFiles = (
    options: {
        accept?: string;
        multiple?: boolean;
    } = {},
): Promise<File[]> =>
    new Promise((resolve, reject) => {
        const input = createFileInput({
            ...options,
            onChange: (files) => resolve(files),
        });

        // Add to DOM temporarily
        document.body.appendChild(input);
        input.click();

        // Clean up after selection
        setTimeout(() => {
            if (document.body.contains(input)) {
                document.body.removeChild(input);
            }
        }, 1000);

        // Handle cancel (no files selected)
        input.addEventListener("cancel", () => {
            reject(new Error(ERROR_MESSAGES.FILE_SELECTION_CANCELLED));
        });
    });

// ========================================
// NEW UPLOAD-SPECIFIC FUNCTIONS
// ========================================

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
 * Create upload progress object
 */
export const createUploadProgress = (fileId: string): UploadProgress => ({
    id: fileId,
    progress: 0,
    status: "NOT_UPLOADED",
    error: undefined,
});

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
 * Prepare bulk upload with validation
 */
export const prepareBulkUpload = (
    files: File[],
): {
    isValid: boolean;
    validFiles: File[];
    invalidFiles: Array<{ file: File; error: string }>;
    totalSize: number;
} => {
    const { valid: validFiles, invalid: invalidFiles } = validateFiles(files);
    const totalSize = validFiles.reduce((total, file) => total + file.size, 0);

    return {
        isValid: invalidFiles.length === 0,
        validFiles,
        invalidFiles,
        totalSize,
    };
};

/**
 * Check upload status helpers
 */
export const isUploadCompleted = (status: UploadStatus): boolean =>
    status === "COMPLETED";
export const isUploadFailed = (status: UploadStatus): boolean =>
    status === "FAILED";
export const isUploadProcessing = (status: UploadStatus): boolean =>
    status === "PROCESSING" || status === "UPLOADING";
export const isUploadIdle = (status: UploadStatus): boolean =>
    status === "NOT_UPLOADED";

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
