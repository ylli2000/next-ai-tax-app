import { Readable } from "stream";
import { env } from "@/schema/envSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/sys/log";

/**
 * AWS S3 Storage Utilities
 * Handles file uploads, downloads, and management for long-term invoice archival
 * Uses AWS SDK v3 for modern TypeScript support and performance
 */

// We'll use dynamic imports to avoid bundling AWS SDK in client-side code

// type PutObjectCommand = any;
// type GetObjectCommand = any;
// type DeleteObjectCommand = any;

let s3Client: unknown = null;

/**
 * Initialize S3 client with configuration
 * Uses lazy loading to avoid client-side bundling issues
 */
const initS3Client = async (): Promise<unknown> => {
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
 * Confirm S3 file upload completion
 * Verifies that the file exists and returns its metadata
 */
export const confirmS3FileUpload = async (
    s3ObjectKey: string,
): Promise<{
    success: boolean;
    fileExists: boolean;
    metadata?: {
        size: number;
        contentType: string;
        lastModified: Date;
        originalName?: string;
    };
    error?: string;
}> => {
    try {
        // Check if file exists
        const exists = await checkS3FileExists(s3ObjectKey);

        if (!exists) {
            return {
                success: false,
                fileExists: false,
                error: ERROR_MESSAGES.S3_FILE_NOT_CONFIRMED,
            };
        }

        // Get file metadata
        const metadataResult = await getS3FileMetadata(s3ObjectKey);

        if (!metadataResult.success) {
            return {
                success: false,
                fileExists: true,
                error: metadataResult.error,
            };
        }

        logInfo("S3 file upload confirmed successfully", {
            s3ObjectKey,
            size: metadataResult.metadata!.size,
            contentType: metadataResult.metadata!.contentType,
        });

        return {
            success: true,
            fileExists: true,
            metadata: {
                size: metadataResult.metadata!.size,
                contentType: metadataResult.metadata!.contentType,
                lastModified: metadataResult.metadata!.lastModified,
                originalName:
                    metadataResult.metadata!.customMetadata.originalName,
            },
        };
    } catch (error) {
        logError("Failed to confirm S3 file upload", { error, s3ObjectKey });
        return {
            success: false,
            fileExists: false,
            error: ERROR_MESSAGES.UPLOAD_CONFIRMATION_FAILED,
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
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { S3Client, GetObjectCommand } = await import(
            "@aws-sdk/client-s3"
        );
        const client = (await initS3Client()) as InstanceType<typeof S3Client>;

        const command = new GetObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
        });

        const response = await client.send(command);

        if (!response.Body) {
            throw new Error("No file content received from S3");
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        const stream = response.Body as Readable;

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
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { S3Client, DeleteObjectCommand } = await import(
            "@aws-sdk/client-s3"
        );
        const client = (await initS3Client()) as InstanceType<typeof S3Client>;

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
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { S3Client, HeadObjectCommand } = await import(
            "@aws-sdk/client-s3"
        );
        const client = (await initS3Client()) as InstanceType<typeof S3Client>;

        const command = new HeadObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
        });

        await client.send(command);
        return true;
    } catch (error) {
        // HeadObject throws error if file doesn't exist
        logError("Failed to check if file exists in S3", {
            error,
            s3ObjectKey,
        });
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
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { S3Client, HeadObjectCommand } = await import(
            "@aws-sdk/client-s3"
        );
        const client = (await initS3Client()) as InstanceType<typeof S3Client>;

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

/**
 * Generate pre-signed URL for downloading files from S3
 * Provides secure, time-limited access to private S3 objects
 * Used for viewing/downloading invoice files safely
 */
export const generatePresignedDownloadUrl = async (
    s3ObjectKey: string,
    expiresIn: number = 3600, // 1 hour default
): Promise<{
    success: boolean;
    signedUrl?: string;
    error?: string;
}> => {
    try {
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { S3Client, GetObjectCommand } = await import(
            "@aws-sdk/client-s3"
        );
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
        const client = (await initS3Client()) as InstanceType<typeof S3Client>;

        const command = new GetObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
        });

        const signedUrl = await getSignedUrl(client, command, {
            expiresIn,
        });

        logInfo("Pre-signed download URL generated successfully", {
            s3ObjectKey,
            expiresIn,
        });

        return {
            success: true,
            signedUrl,
        };
    } catch (error) {
        logError("Failed to generate pre-signed download URL", {
            error,
            s3ObjectKey,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_DOWNLOAD_FAILED,
        };
    }
};

/**
 * Generate pre-signed URL for uploading files to S3
 * Enables secure client-side direct uploads without exposing AWS credentials
 * Used for invoice file uploads with proper security controls
 */
export const generatePresignedUploadUrl = async (
    s3ObjectKey: string,
    contentType: string,
    expiresIn: number = 900, // 15 minutes for uploads
): Promise<{
    success: boolean;
    signedUrl?: string;
    fields?: Record<string, string>;
    error?: string;
}> => {
    try {
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { S3Client, PutObjectCommand } = await import(
            "@aws-sdk/client-s3"
        );
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
        const client = (await initS3Client()) as InstanceType<typeof S3Client>;

        const command = new PutObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: s3ObjectKey,
            ContentType: contentType,
            // Add security headers
            ServerSideEncryption: "AES256",
            StorageClass: "STANDARD_IA", // Infrequent Access for cost optimization
        });

        const signedUrl = await getSignedUrl(client, command, {
            expiresIn,
        });

        logInfo("Pre-signed upload URL generated successfully", {
            s3ObjectKey,
            contentType,
            expiresIn,
        });

        return {
            success: true,
            signedUrl,
            fields: {
                "Content-Type": contentType,
                "x-amz-server-side-encryption": "AES256",
                "x-amz-storage-class": "STANDARD_IA",
            },
        };
    } catch (error) {
        logError("Failed to generate pre-signed upload URL", {
            error,
            s3ObjectKey,
            contentType,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.S3_UPLOAD_FAILED,
        };
    }
};
