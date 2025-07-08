import { z } from "zod";
import {
    API_CONSTANTS,
    ApiRequest,
    ApiRequestOmitFields,
    ApiResponse,
    blobSchema,
    defaultApiResponse,
    mapHttpError,
} from "@/schema/apiSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/logUtils";

/**
 * API utility functions for handling HTTP requests
 *
 * Enhanced error handling features:
 * - Consistent schema-based error messages for better UX
 * - Structured error response format for easier debugging
 * - Comprehensive HTTP status code mapping
 * - Detailed error logging with context
 * - Retry logic with exponential backoff
 * - Timeout handling and abort signal support
 */

/**
 * Base fetch wrapper with error handling and retries
 */
export const fetchWithRetry = async <S extends z.ZodTypeAny>(
    url: string,
    schema: S,
    options: ApiRequest = {},
): Promise<ApiResponse<z.infer<S>>> => {
    const {
        method = "GET",
        headers = {},
        body,
        timeout = API_CONSTANTS.DEFAULT_TIMEOUT,
        retries = API_CONSTANTS.RETRY_ATTEMPTS,
        retryDelay = API_CONSTANTS.DEFAULT_RETRY_DELAY,
        signal,
    } = options;

    // Create timeout signal if none provided
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const effectiveSignal = signal || controller.signal;

    const fetchOptions: RequestInit = {
        method,
        headers: {
            [API_CONSTANTS.CONTENT_TYPE]: API_CONSTANTS.CONTENT_TYPE_JSON,
            ...headers,
        },
        signal: effectiveSignal,
    };

    if (body && method !== "GET") fetchOptions.body = JSON.stringify(body);
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            // Handle different response types
            const contentType = response.headers.get(
                API_CONSTANTS.CONTENT_TYPE,
            );
            let data: z.infer<S>;

            if (contentType?.includes(API_CONSTANTS.CONTENT_TYPE_JSON)) {
                const rawData = await response.json();
                data = schema.parse(rawData);
            } else {
                const textData = await response.text();
                // For non-JSON responses, handle as string and validate with schema
                try {
                    data = schema.parse(textData);
                } catch {
                    // If schema parsing fails, return as error
                    return {
                        ...defaultApiResponse(),
                        error: "INVALID_RESPONSE_FORMAT" as keyof typeof ERROR_MESSAGES,
                        message:
                            textData || ERROR_MESSAGES.INVALID_RESPONSE_FORMAT,
                        statusCode: response.status,
                    };
                }
            }
            if (!response.ok) {
                const { code, message } = mapHttpError(
                    response.status,
                    await response.text().catch(() => ""),
                );

                // Enhanced error logging with context
                logError(`HTTP ${response.status} error for ${method} ${url}`, {
                    status: response.status,
                    statusText: response.statusText,
                    url,
                    method,
                    attempt: attempt + 1,
                    maxAttempts: retries + 1,
                });

                return {
                    ...defaultApiResponse(),
                    error: code,
                    message,
                    statusCode: response.status,
                };
            }

            return {
                ...defaultApiResponse(),
                success: true,
                data,
                statusCode: response.status,
            };
        } catch (error) {
            lastError = error as Error;

            // Enhanced error logging with retry context
            logError(
                `Request attempt ${attempt + 1}/${retries + 1} failed for ${method} ${url}`,
                {
                    error: lastError.message,
                    errorName: lastError.name,
                    attempt: attempt + 1,
                    maxAttempts: retries + 1,
                    isAborted: effectiveSignal.aborted,
                    willRetry: !effectiveSignal.aborted && attempt < retries,
                },
            );

            // Don't retry on abort or if it's the last attempt
            if (effectiveSignal.aborted || attempt === retries) {
                break;
            }
            // Wait before retrying with exponential backoff
            await new Promise((resolve) =>
                setTimeout(resolve, retryDelay * (attempt + 1)),
            );
        }
    }

    clearTimeout(timeoutId);

    // Final error logging for complete failure
    logError(`All ${retries + 1} attempts failed for ${method} ${url}`, {
        finalError: lastError?.message || "Unknown error",
        isTimeout: effectiveSignal.aborted,
        totalAttempts: retries + 1,
    });

    // Determine if error was due to timeout/abort vs network
    const isTimeoutError = effectiveSignal.aborted;
    const errorCode = isTimeoutError ? "NETWORK_ERROR" : "NETWORK_ERROR";
    const errorMessage = isTimeoutError
        ? "Request timed out. Please try again."
        : lastError?.message || ERROR_MESSAGES.NETWORK_ERROR;

    return {
        ...defaultApiResponse(),
        error: errorCode,
        message: errorMessage,
        statusCode: undefined,
    };
};

/**
 * GET request helper
 */
export const get = async <S extends z.ZodTypeAny>(
    url: string,
    schema: S,
    options: Omit<ApiRequest, ApiRequestOmitFields> = {},
): Promise<ApiResponse<z.infer<S>>> =>
    fetchWithRetry(url, schema, { ...options, method: "GET" });

/**
 * POST request helper
 */
export const post = async <S extends z.ZodTypeAny>(
    url: string,
    schema: S,
    body?: unknown,
    options: Omit<ApiRequest, ApiRequestOmitFields> = {},
): Promise<ApiResponse<z.infer<S>>> =>
    fetchWithRetry(url, schema, { ...options, method: "POST", body });

/**
 * PUT request helper
 */
export const put = async <S extends z.ZodTypeAny>(
    url: string,
    schema: S,
    body?: unknown,
    options: Omit<ApiRequest, ApiRequestOmitFields> = {},
): Promise<ApiResponse<z.infer<S>>> =>
    fetchWithRetry(url, schema, { ...options, method: "PUT", body });

/**
 * DELETE request helper
 */
export const deleteRequest = async <S extends z.ZodTypeAny>(
    url: string,
    schema: S,
    options: Omit<ApiRequest, ApiRequestOmitFields> = {},
): Promise<ApiResponse<z.infer<S>>> =>
    fetchWithRetry(url, schema, { ...options, method: "DELETE" });

/**
 * PATCH request helper
 */
export const patch = async <S extends z.ZodTypeAny>(
    url: string,
    schema: S,
    body?: unknown,
    options: Omit<ApiRequest, ApiRequestOmitFields> = {},
): Promise<ApiResponse<z.infer<S>>> =>
    fetchWithRetry(url, schema, { ...options, method: "PATCH", body });

/**
 * Upload file with progress tracking
 */
export const uploadFile = async <S extends z.ZodTypeAny>(
    url: string,
    schema: S,
    file: File,
    options: {
        onProgress?: (progress: number) => void;
        additionalFields?: Record<string, string>;
        headers?: Record<string, string>;
        timeout?: number;
    } = {},
): Promise<ApiResponse<S>> => {
    const {
        onProgress,
        additionalFields = {},
        headers = {},
        timeout = API_CONSTANTS.UPLOAD_TIMEOUT,
    } = options;

    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append("file", file);
        Object.entries(additionalFields).forEach(([key, value]) => {
            formData.append(key, value);
        });

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = (event.loaded / event.total) * 100;
                onProgress(progress);
            }
        });

        xhr.addEventListener("load", () => {
            try {
                let data;
                try {
                    data = JSON.parse(xhr.responseText);
                } catch (parseError) {
                    logError("Failed to parse upload response JSON", {
                        status: xhr.status,
                        responseText: xhr.responseText,
                        parseError: (parseError as Error).message,
                    });

                    resolve({
                        ...defaultApiResponse(),
                        error: "INVALID_RESPONSE_FORMAT",
                        message: ERROR_MESSAGES.INVALID_RESPONSE_FORMAT,
                        statusCode: xhr.status,
                    });
                    return;
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve({
                            ...defaultApiResponse(),
                            success: true,
                            data: schema.parse(data),
                            statusCode: xhr.status,
                        });
                    } catch (validationError) {
                        logError("Upload response validation failed", {
                            status: xhr.status,
                            data,
                            validationError: (validationError as Error).message,
                        });

                        resolve({
                            ...defaultApiResponse(),
                            error: "INVALID_RESPONSE_FORMAT",
                            message: ERROR_MESSAGES.INVALID_RESPONSE_FORMAT,
                            statusCode: xhr.status,
                        });
                    }
                } else {
                    const { code, message } = mapHttpError(
                        xhr.status,
                        data.message || data.error || xhr.statusText,
                    );

                    logError(`Upload failed with HTTP ${xhr.status}`, {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        serverMessage: data.message || data.error,
                        url,
                    });

                    resolve({
                        ...defaultApiResponse(),
                        error: code,
                        message,
                        statusCode: xhr.status,
                    });
                }
            } catch (unexpectedError) {
                logError("Unexpected error in upload handler", {
                    error: (unexpectedError as Error).message,
                    status: xhr.status,
                    responseText: xhr.responseText,
                });

                resolve({
                    ...defaultApiResponse(),
                    error: "UPLOAD_FAILED",
                    message: ERROR_MESSAGES.UPLOAD_FAILED,
                    statusCode: xhr.status,
                });
            }
        });

        xhr.addEventListener("error", () => {
            logError("Upload network error", {
                url,
                fileSize: file.size,
                fileName: file.name,
                readyState: xhr.readyState,
                status: xhr.status,
            });

            resolve({
                ...defaultApiResponse(),
                error: "NETWORK_ERROR",
                message: ERROR_MESSAGES.NETWORK_ERROR,
            });
        });

        xhr.addEventListener("timeout", () => {
            logError("Upload timeout", {
                url,
                fileSize: file.size,
                fileName: file.name,
                timeout,
                readyState: xhr.readyState,
            });

            resolve({
                ...defaultApiResponse(),
                error: "FILE_UPLOAD_TIMEOUT",
                message: ERROR_MESSAGES.FILE_UPLOAD_TIMEOUT,
            });
        });

        xhr.timeout = timeout;
        xhr.open("POST", url);

        Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
        });

        xhr.send(formData);
    });
};

/**
 * Download file from API with enhanced error handling and automatic browser download
 */
export const downloadFile = async (
    url: string,
    filename?: string,
    options: Omit<ApiRequest, "method"> = {},
): Promise<ApiResponse<typeof blobSchema>> => {
    try {
        logInfo(`Starting file download: ${filename || "unknown"}`, {
            url,
            filename,
            hasCustomOptions: Object.keys(options).length > 0,
        });

        const response = await fetchWithRetry(url, blobSchema, {
            ...options,
            method: "GET",
        });

        if (response.success && response.data) {
            // Trigger download if filename is provided
            if (filename && response.data instanceof Blob) {
                try {
                    const blob = response.data;
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = downloadUrl;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrl);

                    logInfo(`File download completed: ${filename}`, {
                        fileSize: blob.size,
                        mimeType: blob.type,
                    });
                } catch (downloadError) {
                    logError("Browser download trigger failed", {
                        filename,
                        error: (downloadError as Error).message,
                        blobSize:
                            response.data instanceof Blob
                                ? response.data.size
                                : "unknown",
                    });

                    // Still return success since the data was retrieved successfully
                    // The consumer can handle the blob manually if needed
                }
            }
            return response as ApiResponse<typeof blobSchema>;
        }

        logError("File download failed", {
            url,
            filename,
            success: response.success,
            error: response.error,
            statusCode: response.statusCode,
        });

        return response as ApiResponse<typeof blobSchema>;
    } catch (error) {
        logError("File download exception", {
            url,
            filename,
            error: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : "UnknownError",
        });

        return {
            ...defaultApiResponse(),
            error: "NETWORK_ERROR",
            message:
                error instanceof Error
                    ? error.message
                    : ERROR_MESSAGES.SERVER_ERROR,
        } as ApiResponse<typeof blobSchema>;
    }
};
