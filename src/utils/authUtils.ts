import crypto from "crypto";
import bcrypt from "bcryptjs";
import { AUTH_CONSTANTS } from "@/schema/authSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { ROUTES } from "@/schema/routeSchema";
import { type UserRole } from "@/schema/userSchema";
import { type User, type UserProfile } from "@/schema/userTables";
import { buildUrl } from "./routeUtils";

/**
 * Authentication utility functions
 * Handles password hashing, JWT operations, role permissions, and session management
 */

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const saltRounds = AUTH_CONSTANTS.BCRYPT_ROUNDS;
        return await bcrypt.hash(password, saltRounds);
    } catch {
        throw new Error(ERROR_MESSAGES.FAILED_TO_HASH_PASSWORD);
    }
};

export const verifyPassword = async (
    password: string,
    hashedPassword: string,
): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch {
        return false;
    }
};

export const generateSecureToken = (
    length: number = AUTH_CONSTANTS.DEFAULT_TOKEN_LENGTH,
): string => crypto.randomBytes(length).toString("hex");

export const generatePasswordResetToken = (): string =>
    crypto.randomBytes(AUTH_CONSTANTS.DEFAULT_TOKEN_LENGTH).toString("hex");

export const generateVerificationToken = (): string =>
    crypto.randomBytes(AUTH_CONSTANTS.DEFAULT_TOKEN_LENGTH).toString("hex");

// Role and permission utilities
export const hasPermission = (
    userRole: UserRole,
    requiredRole: UserRole,
): boolean => {
    const roleHierarchy: Record<UserRole, number> = {
        USER: 0,
        ACCOUNTANT: 1,
        ADMIN: 2,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canAccessUser = (
    currentUser: User,
    targetUserId: string,
): boolean => {
    // Admin can access any user
    if (currentUser.role === "ADMIN") return true;

    // Accountants can access their assigned users (would need additional logic for client assignments)
    if (currentUser.role === "ACCOUNTANT") {
        // For now, accountants can access any user - this would be refined with client assignments
        return true;
    }

    // Users can only access their own data
    return currentUser.id === targetUserId;
};

export const canManageInvoices = (userRole: UserRole): boolean =>
    hasPermission(userRole, "USER");

export const canManageCategories = (userRole: UserRole): boolean =>
    hasPermission(userRole, "USER");

export const canViewAnalytics = (userRole: UserRole): boolean =>
    hasPermission(userRole, "USER");

export const canManageUsers = (userRole: UserRole): boolean =>
    hasPermission(userRole, "ADMIN");

export const canExportData = (userRole: UserRole): boolean =>
    hasPermission(userRole, "USER");

// Session utilities
export const generateSessionId = (): string => crypto.randomUUID();

export const isSessionExpired = (
    createdAt: Date,
    maxAgeInMinutes: number = AUTH_CONSTANTS.SESSION_MAX_AGE,
): boolean => {
    const now = new Date();
    const sessionAge = now.getTime() - createdAt.getTime();
    const maxAge = maxAgeInMinutes * AUTH_CONSTANTS.ONE_MINUTE_MS; // Convert to milliseconds
    return sessionAge > maxAge;
};

export const getSessionTimeRemaining = (
    createdAt: Date,
    maxAgeInMinutes: number = AUTH_CONSTANTS.SESSION_MAX_AGE,
): number => {
    const now = new Date();
    const sessionAge = now.getTime() - createdAt.getTime();
    const maxAge = maxAgeInMinutes * AUTH_CONSTANTS.ONE_MINUTE_MS;
    return Math.max(0, maxAge - sessionAge);
};

// Email verification utilities
export const generateEmailVerificationLink = (
    token: string,
    baseUrl: string,
): string => buildUrl(baseUrl, ROUTES.AUTH.VERIFY_EMAIL, { token });

export const generatePasswordResetLink = (
    token: string,
    baseUrl: string,
): string => buildUrl(baseUrl, ROUTES.AUTH.RESET_PASSWORD, { token });

export const isTokenExpired = (
    createdAt: Date,
    expiryHours: number = 24,
): boolean => {
    const now = new Date();
    const tokenAge = now.getTime() - createdAt.getTime();
    const maxAge = expiryHours * AUTH_CONSTANTS.ONE_HOUR_MS; // Convert to milliseconds
    return tokenAge > maxAge;
};

/**
 * Generate unique rate limiting key for API abuse prevention
 *
 * Purpose: Create Redis/cache keys to track request frequency per user/IP and action type
 * Used by: Future rate limiting middleware, authentication endpoints
 *
 * Usage Examples:
 * ```typescript
 * // Generate unique rate limit keys
 * generateRateLimitKey('user@example.com', 'LOGIN')
 * // Returns: "rate_limit:LOGIN:user@example.com"
 *
 * generateRateLimitKey('192.168.1.1', 'API_CALL')
 * // Returns: "rate_limit:API_CALL:192.168.1.1"
 * ```
 *
 * Planned Usage Scenarios:
 * ```typescript
 * // 1. Login rate limiting in /api/auth/signin
 * const key = generateRateLimitKey(email, 'LOGIN');
 * // Check if this email has exceeded 5 login attempts in 15 minutes
 * if (await isRateLimited(key)) {
 *     return { error: 'Too many login attempts' };
 * }
 *
 * // 2. API call limiting in middleware.ts
 * const key = generateRateLimitKey(userIP, 'API_CALL');
 * // Check if this IP has exceeded 100 API calls in 1 minute
 * if (await isRateLimited(key)) {
 *     return new Response('Rate limit exceeded', { status: 429 });
 * }
 * ```
 *
 * Storage: Will be used with Redis/memory cache to store rate limit counters
 */
export const generateRateLimitKey = (
    identifier: string,
    action: string,
): string => `${AUTH_CONSTANTS.RATE_LIMIT_KEY}:${action}:${identifier}`;

/**
 * Calculate rate limit window reset time
 *
 * Purpose: Determine when rate limit counters should reset/expire
 * Used by: Rate limiting middleware, authentication endpoints
 *
 * Usage Example:
 * ```typescript
 * // Rate limit resets in 15 minutes (900000ms)
 * const resetTime = calculateResetTime(AUTH_CONSTANTS.RATE_LIMIT_LOGIN_WINDOW);
 * // Returns: Date object 15 minutes from now
 *
 * // Store in cache with expiration
 * await redis.setex(rateLimitKey, resetTime, attemptCount);
 * ```
 */
export const calculateResetTime = (windowMs: number): Date =>
    new Date(Date.now() + windowMs);

// User defaults
export const getDefaultUserProfile = (
    userId: string,
): Omit<UserProfile, "id" | "createdAt" | "updatedAt"> => ({
    userId,
    companyName: null,
    notificationsEnabled: true,
});

// Audit utilities
export const createAuditLog = (
    action: string,
    userId: string,
    details?: Record<string, unknown>,
) => ({
    action,
    userId,
    timestamp: new Date(),
    ipAddress: null, // Would be populated from request
    userAgent: null, // Would be populated from request
    details: details || {},
});

// Auth error handling
export const getAuthErrorMessage = (error: string): string =>
    (ERROR_MESSAGES as Record<string, string>)[error] ||
    ERROR_MESSAGES.AUTHENTICATION_FAILED;

// Helper functions for common auth operations
// Quick role checks
export const isAdmin = (user: User): boolean => user.role === "ADMIN";
export const isAccountant = (user: User): boolean => user.role === "ACCOUNTANT";
export const isUser = (user: User): boolean => user.role === "USER";

// Permission shortcuts
export const canManageSystem = (user: User): boolean =>
    hasPermission(user.role, "ADMIN");
export const canViewAllUsers = (user: User): boolean =>
    hasPermission(user.role, "ACCOUNTANT");

// Profile helpers
export const getDisplayName = (user: User): string =>
    user.name || user.email.split("@")[0];

export const getUserInitials = (user: User): string => {
    const name = (user.name || user.email || "") as string;
    return name
        .split(" ")
        .map((word: string) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

// Status helpers
export const isEmailVerified = (user: User): boolean => !!user.emailVerified;
export const isNewUser = (user: User): boolean => {
    const oneDayAgo = new Date(Date.now() - AUTH_CONSTANTS.ONE_DAY_MS);
    return user.createdAt > oneDayAgo;
};
