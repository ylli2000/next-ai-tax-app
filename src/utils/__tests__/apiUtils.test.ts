import { ApiUtils } from '../apiUtils';

global.fetch = jest.fn();

describe('ApiUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWithRetry', () => {
    it('should return data on success', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ foo: 'bar' }),
      });
      const res = await ApiUtils.fetchWithRetry<{ foo: string }>('url');
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ foo: 'bar' });
    });
    it('should handle non-ok response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'bad' }),
        statusText: 'Bad',
      });
      const res = await ApiUtils.fetchWithRetry('url');
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
    });
    it('should retry on error and fail after max retries', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('fail'));
      const res = await ApiUtils.fetchWithRetry('url', { retries: 1, timeout: 10 });
      expect(res.success).toBe(false);
      expect(res.error).toBe('fail');
    });
  });

  describe('HTTP helpers', () => {
    it('should call get/post/put/delete/patch', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ ok: 1 }),
      });
      expect((await ApiUtils.get('url')).success).toBe(true);
      expect((await ApiUtils.post('url', { a: 1 })).success).toBe(true);
      expect((await ApiUtils.put('url', { a: 1 })).success).toBe(true);
      expect((await ApiUtils.delete('url')).success).toBe(true);
      expect((await ApiUtils.patch('url', { a: 1 })).success).toBe(true);
    });
  });

  describe('handleApiError', () => {
    it('should return error message', () => {
      expect(ApiUtils.handleApiError(new Error('fail'))).toBe('fail');
      expect(ApiUtils.handleApiError('err')).toBe('err');
      expect(ApiUtils.handleApiError(undefined)).toMatch(/error/i);
    });
  });

  describe('buildQueryString', () => {
    it('should build query string', () => {
      expect(ApiUtils.buildQueryString({ a: 1, b: 'x' })).toBe('?a=1&b=x');
      expect(ApiUtils.buildQueryString({})).toBe('');
    });
  });

  describe('buildUrl', () => {
    it('should build url with params', () => {
      expect(ApiUtils.buildUrl('base', 'path', { a: 1 })).toBe('base/path?a=1');
      expect(ApiUtils.buildUrl('base', 'path')).toBe('base/path');
    });
  });

  describe('isNetworkError', () => {
    it('should detect network error', () => {
      expect(ApiUtils.isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
      expect(ApiUtils.isNetworkError(new Error('fail'))).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('should detect rate limit', () => {
      expect(ApiUtils.isRateLimitError(429)).toBe(true);
      expect(ApiUtils.isRateLimitError(400)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should detect retryable error', () => {
      expect(ApiUtils.isRetryableError(500)).toBe(true);
      expect(ApiUtils.isRetryableError(429)).toBe(true);
      expect(ApiUtils.isRetryableError(400)).toBe(false);
    });
  });

  describe('createAuthHeaders', () => {
    it('should create auth headers', () => {
      expect(ApiUtils.createAuthHeaders('token')).toEqual({ Authorization: 'Bearer token' });
      expect(ApiUtils.createAuthHeaders('token', 'API-Key')).toEqual({ Authorization: 'API-Key token' });
    });
  });

  describe('parsePaginationHeaders', () => {
    it('should parse pagination headers', () => {
      const headers = { get: (k: string) => ({ 'x-page': '1', 'x-limit': '10', 'x-total': '100', 'x-total-pages': '10' }[k]) } as unknown as Headers;
      expect(ApiUtils.parsePaginationHeaders(headers)).toEqual({ page: 1, limit: 10, total: 100, totalPages: 10 });
    });
  });

  describe('createResponse', () => {
    it('should create response object', () => {
      expect(ApiUtils.createResponse(true, { a: 1 })).toEqual({ success: true, data: { a: 1 } });
      expect(ApiUtils.createResponse(false, undefined, 'err', 400)).toEqual({ success: false, error: 'err', statusCode: 400 });
    });
  });
}); 