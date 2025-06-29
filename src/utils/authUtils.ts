import { type User, type UserProfile, type UserRole } from '@/schema/userSchema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AUTH_CONSTANTS, ERROR_MESSAGES } from './constants';

/**
 * Authentication utility functions
 * Handles password hashing, JWT operations, role permissions, and session management
 */
export class AuthUtils {
    // Password utilities
    static async hashPassword(password: string): Promise<string> {
        try {
            const saltRounds = AUTH_CONSTANTS.BCRYPT_ROUNDS;
            return await bcrypt.hash(password, saltRounds);
        } catch {
            throw new Error('Failed to hash password');
        }
    }

    static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch {
            return false;
        }
    }

    static generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    static generatePasswordResetToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    static generateVerificationToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // Role and permission utilities
    static hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
        const roleHierarchy: Record<UserRole, number> = {
            USER: 0,
            ACCOUNTANT: 1,
            ADMIN: 2,
        };

        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }

    static canAccessUser(currentUser: User, targetUserId: string): boolean {
        // Admin can access any user
        if (currentUser.role === 'ADMIN') return true;
        
        // Accountants can access their assigned users (would need additional logic for client assignments)
        if (currentUser.role === 'ACCOUNTANT') {
            // For now, accountants can access any user - this would be refined with client assignments
            return true;
        }
        
        // Users can only access their own data
        return currentUser.id === targetUserId;
    }

    static canManageInvoices(userRole: UserRole): boolean {
        return this.hasPermission(userRole, 'USER');
    }

    static canManageCategories(userRole: UserRole): boolean {
        return this.hasPermission(userRole, 'USER');
    }

    static canViewAnalytics(userRole: UserRole): boolean {
        return this.hasPermission(userRole, 'USER');
    }

    static canManageUsers(userRole: UserRole): boolean {
        return this.hasPermission(userRole, 'ADMIN');
    }

    static canExportData(userRole: UserRole): boolean {
        return this.hasPermission(userRole, 'USER');
    }

    // Session utilities
    static generateSessionId(): string {
        return crypto.randomUUID();
    }

    static isSessionExpired(createdAt: Date, maxAgeInMinutes: number = AUTH_CONSTANTS.SESSION_MAX_AGE): boolean {
        const now = new Date();
        const sessionAge = now.getTime() - createdAt.getTime();
        const maxAge = maxAgeInMinutes * 60 * 1000; // Convert to milliseconds
        return sessionAge > maxAge;
    }

    static getSessionTimeRemaining(createdAt: Date, maxAgeInMinutes: number = AUTH_CONSTANTS.SESSION_MAX_AGE): number {
        const now = new Date();
        const sessionAge = now.getTime() - createdAt.getTime();
        const maxAge = maxAgeInMinutes * 60 * 1000;
        return Math.max(0, maxAge - sessionAge);
    }

    // User validation utilities
    static validateUserData(userData: Partial<User>): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (userData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                errors.push('Invalid email format');
            }
        }

        if (userData.name && userData.name.length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (userData.role && !['USER', 'ACCOUNTANT', 'ADMIN'].includes(userData.role)) {
            errors.push('Invalid user role');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    static validateUserProfile(profileData: Partial<UserProfile>): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (profileData.timezone) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: profileData.timezone });
            } catch {
                errors.push('Invalid timezone');
            }
        }

        if (profileData.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(profileData.language)) {
            errors.push('Invalid language code format');
        }

        if (profileData.theme && !['LIGHT', 'DARK', 'SYSTEM'].includes(profileData.theme)) {
            errors.push('Invalid theme value');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Email verification utilities
    static generateEmailVerificationLink(token: string, baseUrl: string): string {
        return `${baseUrl}/auth/verify-email?token=${token}`;
    }

    static generatePasswordResetLink(token: string, baseUrl: string): string {
        return `${baseUrl}/auth/reset-password?token=${token}`;
    }

    static isTokenExpired(createdAt: Date, expiryHours: number = 24): boolean {
        const now = new Date();
        const tokenAge = now.getTime() - createdAt.getTime();
        const maxAge = expiryHours * 60 * 60 * 1000; // Convert to milliseconds
        return tokenAge > maxAge;
    }

    // Security utilities
    static sanitizeUserData(user: User): Omit<User, 'emailVerified'> & { emailVerified?: boolean } {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            emailVerified: !!user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    static sanitizeUserProfile(profile: UserProfile): UserProfile {
        return {
            id: profile.id,
            userId: profile.userId,
            displayName: profile.displayName,
            timezone: profile.timezone,
            language: profile.language,
            theme: profile.theme,
            notificationsEnabled: profile.notificationsEnabled,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
        };
    }

    // Rate limiting utilities
    static generateRateLimitKey(identifier: string, action: string): string {
        return `rate_limit:${action}:${identifier}`;
    }

    static calculateResetTime(windowMs: number): Date {
        return new Date(Date.now() + windowMs);
    }

    // OAuth utilities
    static generateOAuthState(): string {
        return crypto.randomBytes(32).toString('base64url');
    }

    static generateCodeVerifier(): string {
        return crypto.randomBytes(32).toString('base64url');
    }

    static generateCodeChallenge(verifier: string): string {
        return crypto.createHash('sha256').update(verifier).digest('base64url');
    }

    // User defaults
    static getDefaultUserProfile(userId: string): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            userId,
            displayName: null,
            timezone: null,
            language: 'en',
            theme: 'SYSTEM',
            notificationsEnabled: true,
        };
    }

    // Audit utilities
    static createAuditLog(action: string, userId: string, details?: Record<string, unknown>) {
        return {
            action,
            userId,
            timestamp: new Date(),
            ipAddress: null, // Would be populated from request
            userAgent: null, // Would be populated from request
            details: details || {},
        };
    }

    // Error handling
    static getAuthErrorMessage(error: string): string {
        const errorMap: Record<string, string> = {
            INVALID_CREDENTIALS: ERROR_MESSAGES.INVALID_CREDENTIALS,
            EMAIL_NOT_VERIFIED: ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
            ACCOUNT_LOCKED: ERROR_MESSAGES.ACCOUNT_LOCKED,
            WEAK_PASSWORD: ERROR_MESSAGES.WEAK_PASSWORD,
            USER_NOT_FOUND: ERROR_MESSAGES.USER_NOT_FOUND,
            TOKEN_EXPIRED: ERROR_MESSAGES.TOKEN_EXPIRED,
            INVALID_TOKEN: ERROR_MESSAGES.INVALID_TOKEN,
            PERMISSION_DENIED: ERROR_MESSAGES.PERMISSION_DENIED,
        };

        return errorMap[error] || ERROR_MESSAGES.AUTHENTICATION_FAILED;
    }
}

// Helper functions for common auth operations
export const authHelpers = {
    // Quick role checks
    isAdmin: (user: User) => user.role === 'ADMIN',
    isAccountant: (user: User) => user.role === 'ACCOUNTANT',
    isUser: (user: User) => user.role === 'USER',
    
    // Permission shortcuts
    canManageSystem: (user: User) => AuthUtils.hasPermission(user.role, 'ADMIN'),
    canViewAllUsers: (user: User) => AuthUtils.hasPermission(user.role, 'ACCOUNTANT'),
    
    // Profile helpers
    getDisplayName: (user: User, profile?: UserProfile) => 
        profile?.displayName || user.name || user.email.split('@')[0],
    
    getUserInitials: (user: User, profile?: UserProfile) => {
        const name = profile?.displayName || user.name || user.email;
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },
    
    // Status helpers
    isEmailVerified: (user: User) => !!user.emailVerified,
    isNewUser: (user: User) => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return user.createdAt > oneDayAgo;
    },
};

export default AuthUtils; 