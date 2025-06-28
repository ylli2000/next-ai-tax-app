export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
    timestamp: string;
};

export type ApiError = {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
};

export type PaginatedResponse<T> = {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
};

export type PaginationParams = {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

export type ErrorResponse = {
    success: false;
    error: ApiError;
    timestamp: string;
};

export type SuccessResponse<T = unknown> = {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type RequestConfig = {
    method: HttpMethod;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
};

export type ApiEndpoint = {
    path: string;
    method: HttpMethod;
    description?: string;
    requiresAuth?: boolean;
    roles?: string[];
};

// Specific API Response Types
export type LoginResponse = {
    user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
    };
    sessionToken: string;
    expiresAt: string;
};

export type UploadResponse = {
    fileId: string;
    fileName: string;
    fileSize: number;
    uploadUrl?: string;
};

export type ExtractionResponse = {
    invoiceId: string;
    extractedData: Record<string, unknown>;
    confidence: number;
    validationResults: unknown;
};

export type StatsResponse = {
    totalInvoices: number;
    totalAmount: number;
    processingStats: {
        pending: number;
        completed: number;
        failed: number;
    };
    categoryBreakdown: Record<string, number>;
}; 