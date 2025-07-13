import { env } from "@/schema/envSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "./logUtils";
const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
/**
 * AWS S3 Storage Utilities
 * Handles file uploads, downloads, and management for long-term invoice archival
 * Uses AWS SDK v3 for modern TypeScript support and performance
 */

// We'll use dynamic imports to avoid bundling AWS SDK in client-side code
type S3Client = any;
type PutObjectCommand = any;
type GetObjectCommand = any;
type DeleteObjectCommand = any;

let s3Client: S3Client | null = null;

/**
 * Initialize S3 client with configuration
 * Uses lazy loading to avoid client-side bundling issues
 */
const initS3Client = async (): Promise<S3Client> => {
    if (s3Client) return s3Client;

    try {
        // Dynamic import to avoid client-side bundling
        const { S3Client } = await import("@aws-sdk/client-s3");

        s3Client = new S3Client({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        logInfo("S3 client initialized successfully", {
            region: env.AWS_REGION,
            bucket: env.AWS_S3_BUCKET,
        });

        return s3Client;
    } catch (error) {
        logError("Failed to initialize S3 client", { error });
        throw new Error(ERROR_MESSAGES.AWS_CONFIGURATION_ERROR);
    }
};

/**
 * Generate S3 object key for invoice file
 * Pattern: invoices/{userId}/{year}/{month}/{filename}
 * This organization helps with data retention and compliance
 */
export const generateS3ObjectKey = (
    userId: string,
    originalFileName: string,
): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    // Extract extension from original filename
    const extension = originalFileName.split(".").pop() || "";
    const baseFileName = originalFileName.replace(/\.[^/.]+$/, "");

    // Sanitize filename for S3
    const sanitizedFileName =
        `${baseFileName}_${timestamp}_${random}.${extension}`
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .replace(/_{2,}/g, "_");

    return `invoices/${userId}/${year}/${month}/${sanitizedFileName}`;
};

/**
 * Upload file to S3 with optimized settings
 * Returns S3 object key for database storage
 */
export const uploadToS3 = async (
    file: File,
    userId: string,
): Promise<{
    success: boolean;
    s3ObjectKey?: string;
    error?: string;
}> => {
    try {
        const client = await initS3Client();
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");

        const s3ObjectKey = generateS3ObjectKey(userId, file.name);

        // Convert File to Buffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const command = new PutObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
            Body: buffer,
            ContentType: file.type,
            ContentLength: file.size,
            Metadata: {
                originalName: file.name,
                userId: userId,
                uploadDate: new Date().toISOString(),
            },
            // Storage class for long-term archival (7-year retention)
            StorageClass: "STANDARD_IA", // Infrequent Access for cost optimization
        });

        await client.send(command);

        logInfo("File uploaded to S3 successfully", {
            s3ObjectKey,
            fileSize: file.size,
            userId,
        });

        return {
            success: true,
            s3ObjectKey,
        };
    } catch (error) {
        logError("Failed to upload file to S3", {
            error,
            userId,
            fileName: file.name,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_UPLOAD_FAILED,
        };
    }
};

/**
 * Download file from S3 for processing or retrieval
 * Returns file buffer and metadata
 */
export const downloadFromS3 = async (
    s3ObjectKey: string,
): Promise<{
    success: boolean;
    buffer?: Buffer;
    metadata?: Record<string, string>;
    error?: string;
}> => {
    try {
        const client = await initS3Client();
        const { GetObjectCommand } = await import("@aws-sdk/client-s3");

        const command = new GetObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
        });

        const response = await client.send(command);

        if (!response.Body) {
            throw new Error("No file content received from S3");
        }

        // Convert stream to buffer
        const chunks: any[] = [];
        const stream = response.Body as any;

        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        logInfo("File downloaded from S3 successfully", {
            s3ObjectKey,
            contentLength: response.ContentLength,
        });

        return {
            success: true,
            buffer,
            metadata: response.Metadata || {},
        };
    } catch (error) {
        logError("Failed to download file from S3", { error, s3ObjectKey });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_DOWNLOAD_FAILED,
        };
    }
};

/**
 * Delete file from S3 (for cleanup or data retention compliance)
 * Use with caution as this is permanent
 */
export const deleteFromS3 = async (
    s3ObjectKey: string,
): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        const client = await initS3Client();
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

        const command = new DeleteObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
        });

        await client.send(command);

        logInfo("File deleted from S3 successfully", { s3ObjectKey });

        return { success: true };
    } catch (error) {
        logError("Failed to delete file from S3", { error, s3ObjectKey });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_DELETE_FAILED,
        };
    }
};

/**
 * Check if file exists in S3
 * Useful for validation and error handling
 */
export const checkS3FileExists = async (
    s3ObjectKey: string,
): Promise<boolean> => {
    try {
        const client = await initS3Client();
        const { HeadObjectCommand } = await import("@aws-sdk/client-s3");

        const command = new HeadObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
        });

        await client.send(command);
        return true;
    } catch (error) {
        // HeadObject throws error if file doesn't exist
        return false;
    }
};

/**
 * Get S3 file metadata without downloading the file
 * Useful for file validation and information display
 */
export const getS3FileMetadata = async (
    s3ObjectKey: string,
): Promise<{
    success: boolean;
    metadata?: {
        size: number;
        lastModified: Date;
        contentType: string;
        customMetadata: Record<string, string>;
    };
    error?: string;
}> => {
    try {
        const client = await initS3Client();

        const command = new HeadObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
        });

        const response = await client.send(command);

        return {
            success: true,
            metadata: {
                size: response.ContentLength || 0,
                lastModified: response.LastModified || new Date(),
                contentType: response.ContentType || "",
                customMetadata: response.Metadata || {},
            },
        };
    } catch (error) {
        logError("Failed to get S3 file metadata", { error, s3ObjectKey });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_METADATA_FAILED,
        };
    }
};
