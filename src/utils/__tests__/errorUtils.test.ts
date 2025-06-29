import {
    AppError,
    ErrorSeverity,
    ErrorType,
    ErrorUtils,
    errorHelpers,
} from '../errorUtils';

describe('ErrorType', () => {
  it('should have all expected error types', () => {
    expect(ErrorType.VALIDATION).toBe('validation');
    expect(ErrorType.NETWORK).toBe('network');
    expect(ErrorType.AUTH).toBe('auth');
    expect(ErrorType.PERMISSION).toBe('permission');
    expect(ErrorType.NOT_FOUND).toBe('not_found');
    expect(ErrorType.SERVER).toBe('server');
    expect(ErrorType.CLIENT).toBe('client');
    expect(ErrorType.TIMEOUT).toBe('timeout');
    expect(ErrorType.RATE_LIMIT).toBe('rate_limit');
    expect(ErrorType.FILE_UPLOAD).toBe('file_upload');
    expect(ErrorType.AI_PROCESSING).toBe('ai_processing');
    expect(ErrorType.DATABASE).toBe('database');
    expect(ErrorType.UNKNOWN).toBe('unknown');
  });
});

describe('ErrorSeverity', () => {
  it('should have all expected severity levels', () => {
    expect(ErrorSeverity.LOW).toBe('low');
    expect(ErrorSeverity.MEDIUM).toBe('medium');
    expect(ErrorSeverity.HIGH).toBe('high');
    expect(ErrorSeverity.CRITICAL).toBe('critical');
  });
});

describe('AppError', () => {
  it('should create error with default values', () => {
    const error = new AppError('Test error');
    
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('AppError');
    expect(error.type).toBe(ErrorType.UNKNOWN);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.statusCode).toBeUndefined();
    expect(error.timestamp).toBeDefined();
    expect(error.context).toBeUndefined();
    expect(error.userMessage).toBe('Internal server error. Please try again');
  });

  it('should create error with all parameters', () => {
    const context = { userId: '123', action: 'test' };
    const error = new AppError(
      'Detailed error',
      ErrorType.VALIDATION,
      ErrorSeverity.HIGH,
      400,
      context,
      'Custom user message'
    );
    
    expect(error.message).toBe('Detailed error');
    expect(error.type).toBe(ErrorType.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.statusCode).toBe(400);
    expect(error.context).toEqual(context);
    expect(error.userMessage).toBe('Custom user message');
  });

  it('should generate user-friendly messages based on error type', () => {
    const validationError = new AppError('Test', ErrorType.VALIDATION);
    expect(validationError.userMessage).toBe('Please check your input and try again.');

    const networkError = new AppError('Test', ErrorType.NETWORK);
    expect(networkError.userMessage).toBe('Network error. Please check your connection');

    const authError = new AppError('Test', ErrorType.AUTH);
    expect(authError.userMessage).toBe('Invalid credentials provided');
  });

  it('should serialize to JSON correctly', () => {
    const context = { test: 'value' };
    const error = new AppError(
      'Test error',
      ErrorType.VALIDATION,
      ErrorSeverity.HIGH,
      400,
      context,
      'User message'
    );
    
    const json = error.toJSON();
    
    expect(json.name).toBe('AppError');
    expect(json.message).toBe('Test error');
    expect(json.type).toBe(ErrorType.VALIDATION);
    expect(json.severity).toBe(ErrorSeverity.HIGH);
    expect(json.statusCode).toBe(400);
    expect(json.context).toEqual(context);
    expect(json.userMessage).toBe('User message');
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });

  it('should maintain proper stack trace', () => {
    const error = new AppError('Test error');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });
});

describe('ErrorUtils', () => {
  describe('createValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = ErrorUtils.createValidationError('Invalid input');
      
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should include context when provided', () => {
      const context = { field: 'email' };
      const error = ErrorUtils.createValidationError('Invalid email', context);
      
      expect(error.context).toEqual(context);
    });
  });

  describe('createNetworkError', () => {
    it('should create network error with default message', () => {
      const error = ErrorUtils.createNetworkError();
      
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.message).toBe('Network error. Please check your connection');
    });

    it('should use custom message when provided', () => {
      const error = ErrorUtils.createNetworkError('Custom network error');
      
      expect(error.message).toBe('Custom network error');
    });
  });

  describe('createAuthError', () => {
    it('should create auth error with correct properties', () => {
      const error = ErrorUtils.createAuthError();
      
      expect(error.type).toBe(ErrorType.AUTH);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.statusCode).toBe(401);
    });
  });

  describe('createPermissionError', () => {
    it('should create permission error with correct properties', () => {
      const error = ErrorUtils.createPermissionError();
      
      expect(error.type).toBe(ErrorType.PERMISSION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.statusCode).toBe(403);
    });
  });

  describe('createNotFoundError', () => {
    it('should create not found error with correct properties', () => {
      const error = ErrorUtils.createNotFoundError();
      
      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('createServerError', () => {
    it('should create server error with correct properties', () => {
      const error = ErrorUtils.createServerError();
      
      expect(error.type).toBe(ErrorType.SERVER);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('parseError', () => {
    it('should return AppError as-is', () => {
      const originalError = new AppError('Test', ErrorType.VALIDATION);
      const parsed = ErrorUtils.parseError(originalError);
      
      expect(parsed).toBe(originalError);
    });

    it('should parse standard Error', () => {
      const originalError = new Error('Standard error');
      const parsed = ErrorUtils.parseError(originalError);
      
      expect(parsed).toBeInstanceOf(AppError);
      expect(parsed.message).toBe('Standard error');
      expect(parsed.type).toBe(ErrorType.UNKNOWN);
      expect(parsed.context?.originalError).toBe('Error');
    });

    it('should parse string error', () => {
      const parsed = ErrorUtils.parseError('String error');
      
      expect(parsed).toBeInstanceOf(AppError);
      expect(parsed.message).toBe('String error');
      expect(parsed.type).toBe(ErrorType.UNKNOWN);
    });

    it('should parse error object with message', () => {
      const errorObj = { message: 'Object error', status: 404 };
      const parsed = ErrorUtils.parseError(errorObj);
      
      expect(parsed).toBeInstanceOf(AppError);
      expect(parsed.message).toBe('Object error');
      expect(parsed.statusCode).toBe(404);
      expect(parsed.type).toBe(ErrorType.NOT_FOUND);
    });

    it('should handle unknown error types', () => {
      const parsed = ErrorUtils.parseError(123);
      
      expect(parsed).toBeInstanceOf(AppError);
      expect(parsed.message).toBe('An unexpected error occurred');
      expect(parsed.type).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('determineErrorTypeFromStatus', () => {
    it('should map status codes to error types correctly', () => {
      expect(ErrorUtils.determineErrorTypeFromStatus(400)).toBe(ErrorType.VALIDATION);
      expect(ErrorUtils.determineErrorTypeFromStatus(401)).toBe(ErrorType.AUTH);
      expect(ErrorUtils.determineErrorTypeFromStatus(403)).toBe(ErrorType.PERMISSION);
      expect(ErrorUtils.determineErrorTypeFromStatus(404)).toBe(ErrorType.NOT_FOUND);
      expect(ErrorUtils.determineErrorTypeFromStatus(408)).toBe(ErrorType.TIMEOUT);
      expect(ErrorUtils.determineErrorTypeFromStatus(429)).toBe(ErrorType.RATE_LIMIT);
      expect(ErrorUtils.determineErrorTypeFromStatus(450)).toBe(ErrorType.CLIENT);
      expect(ErrorUtils.determineErrorTypeFromStatus(500)).toBe(ErrorType.SERVER);
      expect(ErrorUtils.determineErrorTypeFromStatus(200)).toBeUndefined();
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const networkError = new AppError('Test', ErrorType.NETWORK);
      const timeoutError = new AppError('Test', ErrorType.TIMEOUT);
      const rateLimitError = new AppError('Test', ErrorType.RATE_LIMIT);
      const serverError = new AppError('Test', ErrorType.SERVER);
      
      expect(ErrorUtils.isRetryableError(networkError)).toBe(true);
      expect(ErrorUtils.isRetryableError(timeoutError)).toBe(true);
      expect(ErrorUtils.isRetryableError(rateLimitError)).toBe(true);
      expect(ErrorUtils.isRetryableError(serverError)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const validationError = new AppError('Test', ErrorType.VALIDATION);
      const authError = new AppError('Test', ErrorType.AUTH);
      const notFoundError = new AppError('Test', ErrorType.NOT_FOUND);
      
      expect(ErrorUtils.isRetryableError(validationError)).toBe(false);
      expect(ErrorUtils.isRetryableError(authError)).toBe(false);
      expect(ErrorUtils.isRetryableError(notFoundError)).toBe(false);
    });
  });

  describe('shouldReportError', () => {
    it('should not report low severity or client errors', () => {
      const validationError = new AppError('Test', ErrorType.VALIDATION, ErrorSeverity.LOW);
      const authError = new AppError('Test', ErrorType.AUTH);
      const notFoundError = new AppError('Test', ErrorType.NOT_FOUND);
      
      expect(ErrorUtils.shouldReportError(validationError)).toBe(false);
      expect(ErrorUtils.shouldReportError(authError)).toBe(false);
      expect(ErrorUtils.shouldReportError(notFoundError)).toBe(false);
    });

    it('should report server errors and high severity errors', () => {
      const serverError = new AppError('Test', ErrorType.SERVER, ErrorSeverity.HIGH);
      const criticalError = new AppError('Test', ErrorType.UNKNOWN, ErrorSeverity.CRITICAL);
      
      expect(ErrorUtils.shouldReportError(serverError)).toBe(true);
      expect(ErrorUtils.shouldReportError(criticalError)).toBe(true);
    });
  });

  describe('createAsyncErrorHandler', () => {
    it('should handle successful operations', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const handler = ErrorUtils.createAsyncErrorHandler(operation);
      
      const result = await handler();
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle failed operations with fallback', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));
      const handler = ErrorUtils.createAsyncErrorHandler(operation, 'fallback');
      
      const result = await handler();
      
      expect(result).toBe('fallback');
    });

    it('should throw AppError when no fallback provided', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));
      const handler = ErrorUtils.createAsyncErrorHandler(operation);
      
      await expect(handler()).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('createRetryWrapper', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const wrapper = ErrorUtils.createRetryWrapper(operation, 3, 100);
      
      const result = await wrapper();
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry retryable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new AppError('Network error', ErrorType.NETWORK))
        .mockResolvedValue('success');
      
      const wrapper = ErrorUtils.createRetryWrapper(operation, 3, 100);
      
      const resultPromise = wrapper();
      
      // Fast-forward all timers
      await jest.runAllTimersAsync();
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new AppError('Validation error', ErrorType.VALIDATION));
      
      const wrapper = ErrorUtils.createRetryWrapper(operation, 3, 100);
      
      await expect(wrapper()).rejects.toThrow('Validation error');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('formatErrorForUser', () => {
    it('should return user-friendly message', () => {
      const error = new AppError('Technical error', ErrorType.VALIDATION);
      const formatted = ErrorUtils.formatErrorForUser(error);
      
      expect(formatted).toBe('Please check your input and try again.');
    });

    it('should handle unknown errors', () => {
      const formatted = ErrorUtils.formatErrorForUser('Unknown error');
      
      expect(formatted).toBe('Internal server error. Please try again');
    });
  });

  describe('fromValidationErrors', () => {
    it('should create error from validation object', () => {
      const errors = {
        email: 'Invalid email format',
        password: 'Password too short',
      };
      
      const error = ErrorUtils.fromValidationErrors(errors);
      
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('email: Invalid email format');
      expect(error.message).toContain('password: Password too short');
      expect(error.context?.validationErrors).toEqual(errors);
    });
  });

  describe('aggregateErrors', () => {
    it('should return single error when only one provided', () => {
      const singleError = new AppError('Single error');
      const result = ErrorUtils.aggregateErrors([singleError]);
      
      expect(result).toBe(singleError);
    });

    it('should aggregate multiple errors', () => {
      const errors = [
        new AppError('Error 1', ErrorType.VALIDATION, ErrorSeverity.LOW),
        new AppError('Error 2', ErrorType.SERVER, ErrorSeverity.HIGH),
      ];
      
      const result = ErrorUtils.aggregateErrors(errors);
      
      expect(result.message).toContain('Error 1');
      expect(result.message).toContain('Error 2');
      expect(result.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should handle empty error array', () => {
      const result = ErrorUtils.aggregateErrors([]);
      
      expect(result.message).toBe('No errors to aggregate');
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });
  });
});

describe('errorHelpers', () => {
  it('should expose helper functions', () => {
    expect(typeof errorHelpers.parse).toBe('function');
    expect(typeof errorHelpers.format).toBe('function');
    expect(typeof errorHelpers.log).toBe('function');
    expect(typeof errorHelpers.isRetryable).toBe('function');
    expect(typeof errorHelpers.isOffline).toBe('function');
    expect(typeof errorHelpers.validation).toBe('function');
    expect(typeof errorHelpers.network).toBe('function');
    expect(typeof errorHelpers.notFound).toBe('function');
  });

  it('should create validation errors', () => {
    const error = errorHelpers.validation('Invalid input');
    expect(error.type).toBe(ErrorType.VALIDATION);
  });

  it('should create network errors', () => {
    const error = errorHelpers.network();
    expect(error.type).toBe(ErrorType.NETWORK);
  });

  it('should create not found errors', () => {
    const error = errorHelpers.notFound();
    expect(error.type).toBe(ErrorType.NOT_FOUND);
  });

  it('should check if error is offline', () => {
    const networkError = new AppError('network connection failed', ErrorType.NETWORK);
    expect(errorHelpers.isOffline(networkError)).toBe(true);
    
    const validationError = new AppError('validation error', ErrorType.VALIDATION);
    expect(errorHelpers.isOffline(validationError)).toBe(false);
  });
}); 