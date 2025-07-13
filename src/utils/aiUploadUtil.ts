import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "./logUtils";

/**
 * OpenAI file upload and management utilities
 * Handles file operations with OpenAI Files API
 */

// OpenAI client caching (Dynamic import)
let openaiClient: unknown = null;

// ===== Client Management =====

/**
 * Initialize OpenAI client with configuration
 * Uses lazy loading and caching to avoid repeated imports and instantiation
 */
const initOpenAIClient = async () => {
    if (openaiClient) return openaiClient;

    try {
        // Dynamic import to avoid client-side bundling
        const { OpenAI } = await import("openai");
        const { env } = await import("@/schema/envSchema");
        openaiClient = new OpenAI({
            apiKey: env.OPENAI_API_KEY,
            organization: env.OPENAI_ORGANIZATION_ID,
        });
        logInfo("OpenAI client initialized successfully");
        return openaiClient;
    } catch (error) {
        logError("Failed to initialize OpenAI client", { error });
        throw new Error("OpenAI configuration error");
    }
};

// ===== File Operations =====

/**
 * Upload file to OpenAI Files API for temporary processing
 * Returns OpenAI file ID for AI analysis
 */
export const uploadToOpenAI = async (
    file: File,
): Promise<{
    success: boolean;
    openaiFileId?: string;
    error?: string;
}> => {
    try {
        // Use cached OpenAI client
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { OpenAI } = await import("openai");
        const openai = (await initOpenAIClient()) as InstanceType<
            typeof OpenAI
        >;

        // Convert File to the format OpenAI expects
        const fileForUpload = new File([file], file.name, {
            type: file.type,
        });

        const uploadResponse = await openai.files.create({
            file: fileForUpload,
            purpose: "vision", // For invoice image/PDF analysis
        });

        logInfo("File uploaded to OpenAI successfully", {
            openaiFileId: uploadResponse.id,
            fileName: file.name,
            fileSize: file.size,
        });

        return {
            success: true,
            openaiFileId: uploadResponse.id,
        };
    } catch (error) {
        logError("Failed to upload file to OpenAI", {
            error,
            fileName: file.name,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.AI_PROCESSING_FAILED,
        };
    }
};

/**
 * Delete OpenAI file after processing is complete
 * This is part of the dual storage cleanup workflow
 */
export const deleteOpenAIFile = async (
    openaiFileId: string,
): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        // Use cached OpenAI client
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { OpenAI } = await import("openai");
        const openai = (await initOpenAIClient()) as InstanceType<
            typeof OpenAI
        >;

        await openai.files.delete(openaiFileId);

        logInfo("OpenAI file deleted successfully", { openaiFileId });

        return { success: true };
    } catch (error) {
        logError("Failed to delete OpenAI file", { error, openaiFileId });
        return {
            success: false,
            error: "Failed to cleanup temporary file",
        };
    }
};
