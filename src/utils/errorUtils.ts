import { ERROR_MESSAGES } from './constants';
import { DateUtils } from './dateUtils';

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  FILE_UPLOAD = 'file_upload',
  AI_PROCESSING = 'ai_processing',
  DATABASE = 'database',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode?: number;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;
  public readonly userMessage: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode?: number,
    context?: Record<string, unknown>,
    userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.timestamp = DateUtils.now();
    this.context = context;
    this.userMessage = userMessage || this.getUserFriendlyMessage();

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getUserFriendlyMessage(): string {
    switch (this.type) {
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.NETWORK:
        return ERROR_MESSAGES.NETWORK_ERROR;
      case ErrorType.AUTH:
        return ERROR_MESSAGES.INVALID_CREDENTIALS;
      case ErrorType.PERMISSION:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case ErrorType.NOT_FOUND:
        return ERROR_MESSAGES.RECORD_NOT_FOUND;
      case ErrorType.SERVER:
        return ERROR_MESSAGES.SERVER_ERROR;
      case ErrorType.TIMEOUT:
        return 'The request took too long to complete. Please try again.';
      case ErrorType.RATE_LIMIT:
        return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
      case ErrorType.FILE_UPLOAD:
        return ERROR_MESSAGES.UPLOAD_FAILED;
      case ErrorType.AI_PROCESSING:
        return ERROR_MESSAGES.AI_PROCESSING_FAILED;
      case ErrorType.DATABASE:
        return ERROR_MESSAGES.DATABASE_ERROR;
      default:
        return ERROR_MESSAGES.SERVER_ERROR;
    }
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      userMessage: this.userMessage,
      stack: this.stack,
    };
  }
}

/**
 * Error utility functions
 */
export class ErrorUtils {
  /**
   * Create validation error
   */
  static createValidationError(
    message: string,
    context?: Record<string, unknown>
  ): AppError {
    return new AppError(
      message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      400,
      context
    );
  }

  /**
   * Create network error
   */
  static createNetworkError(
    message: string = ERROR_MESSAGES.NETWORK_ERROR,
    context?: Record<string, unknown>
  ): AppError {
    return new AppError(
      message,
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      undefined,
      context
    );
  }

  /**
   * Create authentication error
   */
  static createAuthError(
    message: string = ERROR_MESSAGES.INVALID_CREDENTIALS,
    context?: Record<string, unknown>
  ): AppError {
    return new AppError(
      message,
      ErrorType.AUTH,
      ErrorSeverity.HIGH,
      401,
      context
    );
  }

  /**
   * Create permission error
   */
  static createPermissionError(
    message: string = ERROR_MESSAGES.UNAUTHORIZED,
    context?: Record<string, unknown>
  ): AppError {
    return new AppError(
      message,
      ErrorType.PERMISSION,
      ErrorSeverity.HIGH,
      403,
      context
    );
  }

  /**
   * Create not found error
   */
  static createNotFoundError(
    message: string = ERROR_MESSAGES.RECORD_NOT_FOUND,
    context?: Record<string, unknown>
  ): AppError {
    return new AppError(
      message,
      ErrorType.NOT_FOUND,
      ErrorSeverity.LOW,
      404,
      context
    );
  }

  /**
   * Create server error
   */
  static createServerError(
    message: string = ERROR_MESSAGES.SERVER_ERROR,
    context?: Record<string, unknown>
  ): AppError {
    return new AppError(
      message,
      ErrorType.SERVER,
      ErrorSeverity.HIGH,
      500,
      context
    );
  }

  /**
   * Create file upload error
   */
  static createFileUploadError(
    message: string = ERROR_MESSAGES.UPLOAD_FAILED,
    context?: Record<string, unknown>
  ): AppError {
    return new AppError(
      message,
      ErrorType.FILE_UPLOAD,
      ErrorSeverity.MEDIUM,
      400,
      context
    );
  }

  /**
   * Create AI processing error
   */
  static createAIProcessingError(
    message: string = ERROR_MESSAGES.AI_PROCESSING_FAILED,
    context?: Record<string, unknown>
  ): AppError {
    return new AppError(
      message,
      ErrorType.AI_PROCESSING,
      ErrorSeverity.MEDIUM,
      500,
      context
    );
  }

  /**
   * Parse unknown error and convert to AppError
   */
  static parseError(error: unknown, defaultType: ErrorType = ErrorType.UNKNOWN): AppError {
    // If already an AppError, return as is
    if (error instanceof AppError) {
      return error;
    }

    // If it's a standard Error
    if (error instanceof Error) {
      return new AppError(
        error.message,
        defaultType,
        ErrorSeverity.MEDIUM,
        undefined,
        { originalError: error.name }
      );
    }

    // If it's a string
    if (typeof error === 'string') {
      return new AppError(error, defaultType, ErrorSeverity.MEDIUM);
    }

    // If it's an object with error properties
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      
      const message = 
        (typeof errorObj.message === 'string' ? errorObj.message : '') ||
        (typeof errorObj.error === 'string' ? errorObj.error : '') ||
        'Unknown error occurred';
      
      const statusCode = typeof errorObj.status === 'number' ? errorObj.status :
                        typeof errorObj.statusCode === 'number' ? errorObj.statusCode :
                        undefined;

      const type = this.determineErrorTypeFromStatus(statusCode) || defaultType;
      
      return new AppError(
        message,
        type,
        ErrorSeverity.MEDIUM,
        statusCode,
        { originalError: errorObj }
      );
    }

    // Fallback for any other type
    return new AppError(
      'An unexpected error occurred',
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      undefined,
      { originalError: error }
    );
  }

  /**
   * Determine error type from HTTP status code
   */
  static determineErrorTypeFromStatus(statusCode?: number): ErrorType | undefined {
    if (!statusCode) return undefined;

    if (statusCode === 400) return ErrorType.VALIDATION;
    if (statusCode === 401) return ErrorType.AUTH;
    if (statusCode === 403) return ErrorType.PERMISSION;
    if (statusCode === 404) return ErrorType.NOT_FOUND;
    if (statusCode === 408) return ErrorType.TIMEOUT;
    if (statusCode === 429) return ErrorType.RATE_LIMIT;
    if (statusCode >= 400 && statusCode < 500) return ErrorType.CLIENT;
    if (statusCode >= 500) return ErrorType.SERVER;

    return undefined;
  }

  /**
   * Check if error should be retried
   */
  static isRetryableError(error: AppError): boolean {
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.TIMEOUT,
      ErrorType.RATE_LIMIT,
      ErrorType.SERVER,
    ];

    return retryableTypes.includes(error.type);
  }

  /**
   * Check if error should be reported to error tracking service
   */
  static shouldReportError(error: AppError): boolean {
    // Don't report validation errors or client errors
    const nonReportableTypes = [
      ErrorType.VALIDATION,
      ErrorType.AUTH,
      ErrorType.PERMISSION,
      ErrorType.NOT_FOUND,
    ];

    return !nonReportableTypes.includes(error.type) && 
           error.severity !== ErrorSeverity.LOW;
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: AppError, additionalContext?: Record<string, unknown>): void {
    const logData = {
      ...error.toJSON(),
      ...additionalContext,
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info('Low severity error:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('Medium severity error:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('High severity error:', logData);
        break;
      case ErrorSeverity.CRITICAL:
        console.error('CRITICAL ERROR:', logData);
        break;
    }
  }

  /**
   * Create error boundary error handler
   */
  static createErrorBoundaryHandler() {
    return (error: Error, errorInfo: { componentStack: string }) => {
      const originalError = this.parseError(error, ErrorType.CLIENT);
      const appError = new AppError(
        originalError.message,
        originalError.type,
        originalError.severity,
        originalError.statusCode,
        {
          ...originalError.context,
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
        originalError.userMessage
      );
      
      this.logError(appError);
      
      if (this.shouldReportError(appError)) {
        // Here you could send to error reporting service
        // this.reportError(appError);
      }
    };
  }

  /**
   * Create async error handler for promises
   */
  static createAsyncErrorHandler<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    errorType: ErrorType = ErrorType.UNKNOWN
  ) {
    return async (): Promise<T | undefined> => {
      try {
        return await operation();
      } catch (error) {
        const appError = this.parseError(error, errorType);
        this.logError(appError);
        
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        
        throw appError;
      }
    };
  }

  /**
   * Create retry wrapper with exponential backoff
   */
  static createRetryWrapper<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ) {
    return async (): Promise<T> => {
      let lastError: AppError;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = this.parseError(error);
          
          // Don't retry if error is not retryable or it's the last attempt
          if (!this.isRetryableError(lastError) || attempt === maxRetries) {
            break;
          }
          
          // Wait with exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError!;
    };
  }

  /**
   * Format error for user display
   */
  static formatErrorForUser(error: unknown): string {
    const appError = this.parseError(error);
    return appError.userMessage;
  }

  /**
   * Extract error details for debugging
   */
  static extractErrorDetails(error: unknown): {
    message: string;
    type: string;
    stack?: string;
    context?: Record<string, unknown>;
  } {
    const appError = this.parseError(error);
    
    return {
      message: appError.message,
      type: appError.type,
      stack: appError.stack,
      context: appError.context,
    };
  }

  /**
   * Check if error indicates offline status
   */
  static isOfflineError(error: unknown): boolean {
    const appError = this.parseError(error);
    
    return appError.type === ErrorType.NETWORK &&
           (appError.message.includes('offline') ||
            appError.message.includes('network') ||
            appError.message.includes('connection'));
  }

  /**
   * Create error from validation result
   */
  static fromValidationErrors(errors: Record<string, string>): AppError {
    const messages = Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
    
    return new AppError(
      `Validation failed: ${messages}`,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      400,
      { validationErrors: errors }
    );
  }

  /**
   * Aggregate multiple errors
   */
  static aggregateErrors(errors: AppError[]): AppError {
    if (errors.length === 0) {
      return new AppError('No errors to aggregate', ErrorType.UNKNOWN);
    }
    
    if (errors.length === 1) {
      return errors[0];
    }
    
    const messages = errors.map(e => e.message).join('; ');
    const highestSeverity = errors.reduce((max, error) => {
      const severityOrder = {
        [ErrorSeverity.LOW]: 1,
        [ErrorSeverity.MEDIUM]: 2,
        [ErrorSeverity.HIGH]: 3,
        [ErrorSeverity.CRITICAL]: 4,
      };
      
      return severityOrder[error.severity] > severityOrder[max] ? error.severity : max;
    }, ErrorSeverity.LOW);
    
    return new AppError(
      `Multiple errors occurred: ${messages}`,
      ErrorType.UNKNOWN,
      highestSeverity,
      undefined,
      { aggregatedErrors: errors.map(e => e.toJSON()) }
    );
  }
}

/**
 * Error handling helpers
 */
export const errorHelpers = {
  /**
   * Parse any error to AppError
   */
  parse: (error: unknown) => ErrorUtils.parseError(error),
  
  /**
   * Format error for user display
   */
  format: (error: unknown) => ErrorUtils.formatErrorForUser(error),
  
  /**
   * Log error appropriately
   */
  log: (error: unknown, context?: Record<string, unknown>) => {
    const appError = ErrorUtils.parseError(error);
    ErrorUtils.logError(appError, context);
  },
  
  /**
   * Check if error should be retried
   */
  isRetryable: (error: unknown) => {
    const appError = ErrorUtils.parseError(error);
    return ErrorUtils.isRetryableError(appError);
  },
  
  /**
   * Check if user is offline based on error
   */
  isOffline: (error: unknown) => ErrorUtils.isOfflineError(error),
  
  /**
   * Create validation error
   */
  validation: (message: string, context?: Record<string, unknown>) =>
    ErrorUtils.createValidationError(message, context),
  
  /**
   * Create network error
   */
  network: (message?: string, context?: Record<string, unknown>) =>
    ErrorUtils.createNetworkError(message, context),
  
  /**
   * Create not found error
   */
  notFound: (message?: string, context?: Record<string, unknown>) =>
    ErrorUtils.createNotFoundError(message, context),
}; 