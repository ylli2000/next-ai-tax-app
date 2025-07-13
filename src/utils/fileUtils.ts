import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { UPLOAD_CONSTANTS } from "@/schema/uploadSchema";
import { formatFileSize } from "./formatUtils";

/**
 * File utility functions
 * Handles basic file operations, validation, and metadata extraction
 */

// ===== File Extension Operations =====

export const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex >= 0 ? filename.slice(lastDotIndex) : "";
};

export const getFileNameWithoutExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex >= 0 ? filename.slice(0, lastDotIndex) : filename;
};

// ===== File Type Detection =====

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

// ===== File Validation =====

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

// ===== File Name Utilities =====

export const generateUniqueFilename = (originalName: string): string => {
    const extension = getFileExtension(originalName);
    const nameWithoutExt = getFileNameWithoutExtension(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
};

export const sanitizeFilename = (filename: string): string =>
    filename
        .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace invalid characters with underscore
        .replace(/_{2,}/g, "_") // Replace multiple underscores with single
        .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

// ===== File Conversion and Metadata =====

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

export const getFileMetadata = (
    file: File,
): {
    name: string;
    size: number;
    type: string;
    extension: string;
    lastModified: Date;
    isImage: boolean;
    isPdf: boolean;
} => ({
    name: file.name,
    size: file.size,
    type: file.type,
    extension: getFileExtension(file.name),
    lastModified: new Date(file.lastModified),
    isImage: isImageFile(file),
    isPdf: isPdfFile(file),
});
