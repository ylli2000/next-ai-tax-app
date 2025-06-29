import { API_CONSTANTS, ERROR_MESSAGES } from './constants';

/**
 * API response wrapper type
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
};

/**
 * API request options
 */
export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
};

/**
 * API utility functions for handling HTTP requests
 */
export class ApiUtils {
  /**
   * Base fetch wrapper with error handling and retries
   */
  static async fetchWithRetry<T = unknown>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONSTANTS.DEFAULT_TIMEOUT,
      retries = API_CONSTANTS.RETRY_ATTEMPTS,
      retryDelay = 1000,
      signal,
    } = options;

    // Create timeout signal if none provided
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const effectiveSignal = signal || controller.signal;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: effectiveSignal,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Handle different response types
        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }

        if (!response.ok) {
          return {
            success: false,
            error: data ? String(data) : response.statusText,
            statusCode: response.status,
          };
        }

        return {
          success: true,
          data,
          statusCode: response.status,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort or if it's the last attempt
        if (effectiveSignal.aborted || attempt === retries) {
          break;
        }

        // Wait before retrying
        await this.delay(retryDelay * (attempt + 1));
      }
    }

    clearTimeout(timeoutId);

    return {
      success: false,
      error: lastError?.message || ERROR_MESSAGES.NETWORK_ERROR,
    };
  }

  /**
   * GET request helper
   */
  static async get<T = unknown>(
    url: string,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request helper
   */
  static async post<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * PUT request helper
   */
  static async put<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request helper
   */
  static async delete<T = unknown>(
    url: string,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request helper
   */
  static async patch<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, { ...options, method: 'PATCH', body });
  }

  /**
   * Upload file with progress tracking
   */
  static async uploadFile<T = unknown>(
    url: string,
    file: File,
    options: {
      onProgress?: (progress: number) => void;
      additionalFields?: Record<string, string>;
      headers?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { onProgress, additionalFields = {}, headers = {}, timeout = 60000 } = options;

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      formData.append('file', file);
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              data,
              statusCode: xhr.status,
            });
          } else {
            resolve({
              success: false,
              error: data.message || data.error || xhr.statusText,
              statusCode: xhr.status,
            });
          }
        } catch {
          resolve({
            success: false,
            error: xhr.responseText || ERROR_MESSAGES.UPLOAD_FAILED,
            statusCode: xhr.status,
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: ERROR_MESSAGES.NETWORK_ERROR,
        });
      });

      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'Upload timeout',
        });
      });

      xhr.timeout = timeout;
      xhr.open('POST', url);
      
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(formData);
    });
  }

  /**
   * Handle API errors and extract meaningful messages
   */
  static handleApiError(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      
      // Check for common error message fields
      if (errorObj.message && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
      
      if (errorObj.error && typeof errorObj.error === 'string') {
        return errorObj.error;
      }
      
      if (errorObj.details && typeof errorObj.details === 'string') {
        return errorObj.details;
      }
    }

    return ERROR_MESSAGES.SERVER_ERROR;
  }

  /**
   * Create API response wrapper
   */
  static createResponse<T>(
    success: boolean,
    data?: T,
    error?: string,
    statusCode?: number
  ): ApiResponse<T> {
    return {
      success,
      data,
      error,
      statusCode,
    };
  }

  /**
   * Build query string from object
   */
  static buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            searchParams.append(key, String(item));
          });
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Combine base URL with path and query parameters
   */
  static buildUrl(baseUrl: string, path: string, params?: Record<string, unknown>): string {
    const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    const queryString = params ? this.buildQueryString(params) : '';
    return url + queryString;
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.name === 'NetworkError' ||
        error.name === 'TypeError' ||
        error.message.includes('fetch') ||
        error.message.includes('network')
      );
    }
    return false;
  }

  /**
   * Check if error indicates rate limiting
   */
  static isRateLimitError(statusCode?: number): boolean {
    return statusCode === 429;
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(statusCode?: number, error?: unknown): boolean {
    // Retry on network errors
    if (this.isNetworkError(error)) {
      return true;
    }

    // Retry on server errors (5xx) but not client errors (4xx)
    if (statusCode) {
      return statusCode >= 500 || statusCode === 429; // Include rate limit for retry
    }

    return false;
  }

  /**
   * Delay helper for retries
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create headers with authentication
   */
  static createAuthHeaders(token: string, type: 'Bearer' | 'API-Key' = 'Bearer'): Record<string, string> {
    return {
      Authorization: `${type} ${token}`,
    };
  }

  /**
   * Parse pagination metadata from headers or response
   */
  static parsePaginationHeaders(headers: Headers): {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  } {
    return {
      page: headers.get('x-page') ? Number(headers.get('x-page')) : undefined,
      limit: headers.get('x-limit') ? Number(headers.get('x-limit')) : undefined,
      total: headers.get('x-total') ? Number(headers.get('x-total')) : undefined,
      totalPages: headers.get('x-total-pages') ? Number(headers.get('x-total-pages')) : undefined,
    };
  }

  /**
   * Convert response to standardized error
   */
  static async responseToError(response: Response): Promise<Error> {
    let message = response.statusText;
    
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch {
      // Use status text if JSON parsing fails
    }
    
    const error = new Error(message) as Error & { status: number; statusCode: number };
    error.status = response.status;
    error.statusCode = response.status;
    
    return error;
  }

  /**
   * Download file from API
   */
  static async downloadFile(
    url: string,
    filename?: string,
    options: Omit<ApiRequestOptions, 'method'> = {}
  ): Promise<ApiResponse<Blob>> {
    try {
      const response = await this.fetchWithRetry<Blob>(url, { ...options, method: 'GET' });
      
      if (response.success && response.data) {
        // Trigger download if filename is provided
        if (filename) {
          const blob = response.data;
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
        }
        
        return response;
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: this.handleApiError(error),
      };
    }
  }
}

/**
 * API endpoint builder helper
 */
export class ApiEndpoints {
  constructor(private baseUrl: string) {}

  /**
   * Build endpoint URL
   */
  build(path: string, params?: Record<string, unknown>): string {
    return ApiUtils.buildUrl(this.baseUrl, path, params);
  }

  /**
   * Invoice endpoints
   */
  invoices = {
    list: (params?: Record<string, unknown>) => this.build('/api/invoices', params),
    get: (id: string) => this.build(`/api/invoices/${id}`),
    create: () => this.build('/api/invoices'),
    update: (id: string) => this.build(`/api/invoices/${id}`),
    delete: (id: string) => this.build(`/api/invoices/${id}`),
    upload: () => this.build('/api/invoices/upload'),
    extract: () => this.build('/api/ai/extract'),
  };

  /**
   * Category endpoints
   */
  categories = {
    list: (params?: Record<string, unknown>) => this.build('/api/categories', params),
    get: (id: string) => this.build(`/api/categories/${id}`),
    create: () => this.build('/api/categories'),
    update: (id: string) => this.build(`/api/categories/${id}`),
    delete: (id: string) => this.build(`/api/categories/${id}`),
  };

  /**
   * Export endpoints
   */
  export = {
    invoices: (params?: Record<string, unknown>) => this.build('/api/export/invoices', params),
    categories: (params?: Record<string, unknown>) => this.build('/api/export/categories', params),
  };

  /**
   * Auth endpoints
   */
  auth = {
    signin: () => this.build('/api/auth/signin'),
    signup: () => this.build('/api/auth/signup'),
    signout: () => this.build('/api/auth/signout'),
    session: () => this.build('/api/auth/session'),
  };
}

/**
 * Common API helpers
 */
export const apiHelpers = {
  /**
   * Standard GET request
   */
  get: <T>(url: string) => ApiUtils.get<T>(url),
  
  /**
   * Standard POST request
   */
  post: <T>(url: string, data?: unknown) => ApiUtils.post<T>(url, data),
  
  /**
   * Standard PUT request
   */
  put: <T>(url: string, data?: unknown) => ApiUtils.put<T>(url, data),
  
  /**
   * Standard DELETE request
   */
  delete: <T>(url: string) => ApiUtils.delete<T>(url),
  
  /**
   * Upload file with progress
   */
  upload: <T>(url: string, file: File, onProgress?: (progress: number) => void) =>
    ApiUtils.uploadFile<T>(url, file, { onProgress }),
  
  /**
   * Handle API errors
   */
  handleError: (error: unknown) => ApiUtils.handleApiError(error),
  
  /**
   * Build query string
   */
  buildQuery: (params: Record<string, unknown>) => ApiUtils.buildQueryString(params),
}; 