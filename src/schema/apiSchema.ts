import { z } from "zod";
import { ERROR_MESSAGES, ErrorMessageValuesSchema } from "./messageSchema";

/**
 * API-related schemas using Zod for runtime validation and type inference
 * Handles API requests, responses, pagination, and error handling
 */

/**
 * API Paths Constants - Server-to-server precise endpoint definitions
 *
 * Purpose: Define exact API endpoints for server-side routing and client-side API calls
 * Used by: ApiEndpoints class, server route handlers, API client utilities
 *
 * Design: Uses parameterized functions for dynamic paths (e.g., BY_ID(id))
 * to ensure type safety and precise endpoint matching
 *
 * Usage Examples:
 * ```typescript
 * // In API route handlers
 * app.get(API_PATHS.INVOICES.BASE, handler)           // '/api/invoices'
 * app.get(API_PATHS.INVOICES.BY_ID(':id'), handler)   // '/api/invoices/:id'
 *
 * // In client API calls
 * fetch(API_PATHS.INVOICES.BY_ID('123'))              // '/api/invoices/123'
 * fetch(API_PATHS.CATEGORIES.BASE)                    // '/api/categories'
 * ```
 */
export const API_PATHS = {
    INVOICES: {
        BASE: "/api/invoices",
        BY_ID: (id: string) => `/api/invoices/${id}`,
        UPLOAD: "/api/invoices/upload",
    },
    CATEGORIES: {
        BASE: "/api/categories",
        BY_ID: (id: string) => `/api/categories/${id}`,
    },
    EXPORT: {
        INVOICES: "/api/export/invoices",
        CATEGORIES: "/api/export/categories",
    },
    AUTH: {
        SIGNIN: "/api/auth/signin",
        SIGNUP: "/api/auth/signup",
        SIGNOUT: "/api/auth/signout",
        SESSION: "/api/auth/session",
    },
    AI: {
        EXTRACT: "/api/ai/extract",
    },
} as const;
/**
 * Map HTTP status codes to consistent error codes and messages
 * Uses ternary operators for more concise and readable code
 */
export const mapHttpError = (
    status: number,
    responseText?: string,
): {
    code: keyof typeof ERROR_MESSAGES;
    message: string;
} => {
    // prettier-ignore
    const code: keyof typeof ERROR_MESSAGES = 
        status === 400 ? "INVALID_RESPONSE_FORMAT" :
        status === 401 ? "UNAUTHORIZED" :
        status === 403 ? "PERMISSION_DENIED" :
        status === 404 ? "RECORD_NOT_FOUND" :
        status === 409 ? "DUPLICATE_RECORD" :
        status === 413 ? "FILE_TOO_LARGE" :
        status === 422 ? "VALIDATION_FAILED" :
        status === 429 ? "RATE_LIMIT_EXCEEDED" :
        (status > 500 && status < 600) ? "NETWORK_ERROR" :
        "SERVER_ERROR"; //500 etc.
    // prettier-ignore
    const message = 
        status === 400 ? ERROR_MESSAGES.INVALID_RESPONSE_FORMAT :
        status === 401 ? ERROR_MESSAGES.UNAUTHORIZED : 
        status === 403 ? ERROR_MESSAGES.PERMISSION_DENIED :
        status === 404 ? ERROR_MESSAGES.RECORD_NOT_FOUND :
        status === 409 ? ERROR_MESSAGES.DUPLICATE_RECORD :
        status === 413 ? ERROR_MESSAGES.FILE_TOO_LARGE :
        status === 422 ? ERROR_MESSAGES.VALIDATION_FAILED :
        status === 429 ? ERROR_MESSAGES.RATE_LIMIT_EXCEEDED :
        (status > 500 && status < 600) ? ERROR_MESSAGES.NETWORK_ERROR :
        responseText || ERROR_MESSAGES.SERVER_ERROR; //500 etc.

    return { code, message };
};

// API Constants
export const API_CONSTANTS = {
    DEFAULT_TIMEOUT: 30000, // Used in API client and fetch requests timeout (ms)
    RETRY_ATTEMPTS: 3, // Used in apiUtils.ts for failed request retry logic
    RATE_LIMIT_WINDOW: 60000, // Used in API middleware for rate limiting window (1 minute)
    RATE_LIMIT_MAX: 100, // Used in API middleware for max requests per window
    DEFAULT_RETRY_DELAY: 1000, // Used in apiUtils.ts for retry delay timing (ms)
    UPLOAD_TIMEOUT: 60000, // Used in apiUtils.ts for file upload timeout (ms)

    // Content type constants
    CONTENT_TYPE: "Content-Type",
    CONTENT_TYPE_JSON: "application/json", // Used in apiUtils.ts for JSON content type header

    // Authentication constants
    DEFAULT_AUTH_TYPE: "Bearer", // Used in apiUtils.ts for authentication header type
} as const;

//API Request Options
export const ApiRequestOmitFieldsEnum = ["method", "body"] as const;
export const ApiRequestOmitFieldsSchema = z.enum(ApiRequestOmitFieldsEnum);
export type ApiRequestOmitFields = z.infer<typeof ApiRequestOmitFieldsSchema>;

export const HttpMethodEnum = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
] as const;
export const httpMethodSchema = z.enum(HttpMethodEnum);
export type HttpMethod = z.infer<typeof httpMethodSchema>;

export const ApiRequestSchema = z.object({
    method: httpMethodSchema.optional(),
    headers: z.record(z.string()).optional(),
    body: z.unknown().optional(),
    timeout: z.number().min(0).max(API_CONSTANTS.DEFAULT_TIMEOUT).optional(),
    retries: z.number().min(0).max(API_CONSTANTS.RETRY_ATTEMPTS).optional(),
    retryDelay: z
        .number()
        .min(0)
        .max(API_CONSTANTS.DEFAULT_RETRY_DELAY)
        .optional(),
    signal: z.instanceof(AbortSignal).optional(),
});
export type ApiRequest = z.infer<typeof ApiRequestSchema>;

// Generic API Response Schema
export const createApiResponseSchema = <T extends z.ZodTypeAny>(
    dataSchema: T,
) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: ErrorMessageValuesSchema.optional(), // Error code from messageSchema (e.g., 'RECORD_NOT_FOUND', 'SERVER_ERROR')
        message: z.string().optional(), // User-friendly error message (e.g., 'Record not found')
        statusCode: z.number().optional(),
        timestamp: z.string().datetime().optional(),
    });
export type ApiResponse<T extends z.ZodTypeAny> = z.infer<
    ReturnType<typeof createApiResponseSchema<T>>
>;

/**
 * Create standardized API response with default values
 */
export const defaultApiResponse = () => ({
    success: false,
    data: undefined,
    error: undefined,
    message: undefined,
    statusCode: undefined,
    timestamp: new Date().toISOString(),
});

// API Endpoint Schema
export const apiEndpointSchema = z.object({
    path: z.string().min(1),
    method: httpMethodSchema,
    description: z.string().optional(),
    requiresAuth: z.boolean().optional().default(false),
    roles: z.array(z.string()).optional(),
});
export type ApiEndpoint = z.infer<typeof apiEndpointSchema>;

// Specific API Response Schemas

// Login Response Schema
export const loginResponseSchema = z.object({
    user: z.object({
        id: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
        email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
        name: z.string().nullable(),
        role: z.string(),
    }),
    sessionToken: z.string(),
    expiresAt: z.string().datetime(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Upload Response Schema
export const uploadResponseSchema = z.object({
    fileId: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
    fileName: z.string().min(1),
    fileSize: z.number().min(0),
    uploadUrl: z.string().url(ERROR_MESSAGES.INVALID_URL),
});
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

// Extraction Response Schema
export const extractionResponseSchema = z.object({
    invoiceId: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
    extractedData: z.record(z.unknown()),
    confidence: z.number().min(0).max(1),
    validationResults: z.unknown(),
});
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;

// Processing Stats Schema
export const processingStatsSchema = z.object({
    pending: z.number().min(0),
    completed: z.number().min(0),
    failed: z.number().min(0),
});
export type ProcessingStats = z.infer<typeof processingStatsSchema>;

// Stats Response Schema
export const statsResponseSchema = z.object({
    totalInvoices: z.number().min(0),
    totalAmount: z.number().min(0),
    processingStats: processingStatsSchema,
    categoryBreakdown: z.record(z.string(), z.number().min(0)),
});
export type StatsResponse = z.infer<typeof statsResponseSchema>;

// File Download Response Schema
export const blobSchema = z.instanceof(Blob);
export type BlobData = z.infer<typeof blobSchema>;
