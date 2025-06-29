import { type User } from '@/types/userSchema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuthUtils } from '../authUtils';

jest.mock('bcryptjs');
jest.mock('crypto');

describe('AuthUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword & verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const hash = await AuthUtils.hashPassword('test123');
      expect(hash).toBe('hashed');
      const valid = await AuthUtils.verifyPassword('test123', 'hashed');
      expect(valid).toBe(true);
    });
    it('should return false if verifyPassword throws', async () => {
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('fail'));
      const valid = await AuthUtils.verifyPassword('test123', 'hashed');
      expect(valid).toBe(false);
    });
  });

  describe('token generators', () => {
    it('should generate secure tokens', () => {
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('a'.repeat(32)));
      expect(AuthUtils.generateSecureToken(16)).toMatch(/^[a-f0-9]+$/);
      expect(AuthUtils.generatePasswordResetToken()).toMatch(/^[a-f0-9]+$/);
      expect(AuthUtils.generateVerificationToken()).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('role/permission', () => {
    it('should check permission hierarchy', () => {
      expect(AuthUtils.hasPermission('ADMIN', 'USER')).toBe(true);
      expect(AuthUtils.hasPermission('USER', 'ADMIN')).toBe(false);
    });
    it('should check canAccessUser', () => {
      const admin: User = { id: '1', email: '', name: '', image: '', role: 'ADMIN', emailVerified: new Date(), createdAt: new Date(), updatedAt: new Date() };
      const user: User = { ...admin, id: '2', role: 'USER' };
      expect(AuthUtils.canAccessUser(admin, '2')).toBe(true);
      expect(AuthUtils.canAccessUser(user, '2')).toBe(true);
      expect(AuthUtils.canAccessUser(user, '3')).toBe(false);
    });
  });

  describe('session utilities', () => {
    it('should generate session id', () => {
      (crypto.randomUUID as jest.Mock).mockReturnValue('uuid');
      expect(AuthUtils.generateSessionId()).toBe('uuid');
    });
    it('should check session expired', () => {
      const now = new Date();
      const old = new Date(now.getTime() - 1000 * 60 * 61); // 61 min ago
      expect(AuthUtils.isSessionExpired(old, 60)).toBe(true);
      expect(AuthUtils.isSessionExpired(now, 60)).toBe(false);
    });
    it('should get session time remaining', () => {
      const now = new Date();
      const old = new Date(now.getTime() - 1000 * 60 * 30); // 30 min ago
      expect(AuthUtils.getSessionTimeRemaining(old, 60)).toBeGreaterThan(0);
    });
  });

  describe('user validation', () => {
    it('should validate user data', () => {
      expect(AuthUtils.validateUserData({ email: 'bad', name: 'A', role: 'ADMIN' })).toEqual({ isValid: false, errors: expect.arrayContaining(['Invalid email format', 'Name must be at least 2 characters long']) });
      expect(AuthUtils.validateUserData({ email: 'a@b.com', name: 'Ab', role: 'USER' })).toEqual({ isValid: true, errors: [] });
    });
    it('should validate user profile', () => {
      expect(AuthUtils.validateUserProfile({ timezone: 'bad', language: 'bad', theme: 'SYSTEM' })).toEqual({ isValid: false, errors: expect.arrayContaining(['Invalid timezone', 'Invalid language code format']) });
      expect(AuthUtils.validateUserProfile({ timezone: 'Australia/Sydney', language: 'en', theme: 'LIGHT' })).toEqual({ isValid: true, errors: [] });
    });
  });

  describe('link generators', () => {
    it('should generate verification and reset links', () => {
      expect(AuthUtils.generateEmailVerificationLink('token', 'http://a')).toBe('http://a/auth/verify-email?token=token');
      expect(AuthUtils.generatePasswordResetLink('token', 'http://a')).toBe('http://a/auth/reset-password?token=token');
    });
  });

  describe('token expiry', () => {
    it('should check token expired', () => {
      const now = new Date();
      const old = new Date(now.getTime() - 1000 * 60 * 60 * 25); // 25h ago
      expect(AuthUtils.isTokenExpired(old, 24)).toBe(true);
      expect(AuthUtils.isTokenExpired(now, 24)).toBe(false);
    });
  });
}); 