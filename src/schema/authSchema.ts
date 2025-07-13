import { z } from "zod";
import { ERROR_MESSAGES } from "./messageSchema";
import { userRoleSchema } from "./userSchema";
import { VALIDATION_RULES } from "./commonSchemas";

/**
 * Authentication schemas using Zod for runtime validation and type inference
 * Handles all authentication-related UI forms and validations
 */

// Authentication state enums
export const TokenTypeEnum = [
    "PASSWORD_RESET",
    "EMAIL_VERIFICATION",
    "API_TOKEN",
] as const;
export const tokenTypeSchema = z.enum(TokenTypeEnum);
export type TokenType = z.infer<typeof tokenTypeSchema>;

export const AuthProviderEnum = ["google", "github", "credentials"] as const;
export const authProviderSchema = z.enum(AuthProviderEnum);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const AuthActionEnum = [
    "SIGNIN",
    "SIGNUP",
    "SIGNOUT",
    "RESET_PASSWORD",
    "VERIFY_EMAIL",
    "CHANGE_PASSWORD",
] as const;
export const authActionSchema = z.enum(AuthActionEnum);
export type AuthAction = z.infer<typeof authActionSchema>;

export const SESSION_STRATEGY = "jwt" as const;
// Auth constants
export const AUTH_CONSTANTS = {
    PROVIDERS: {
        GOOGLE: "google",
        GITHUB: "github",
        CREDENTIALS: "credentials",
    },
    RATE_LIMIT_KEY: "rate_limit",
    BCRYPT_ROUNDS: 12, // Used in authUtils.ts for password hashing strength
    SESSION_MAX_AGE: 7 * 60 * 24, // Used in NextAuth configuration for session duration (7 days in minutes)
    TOKEN_EXPIRY_HOURS: 24, // Used in JWT token generation and validation
    PASSWORD_RESET_EXPIRY_HOURS: 2, // Used in password reset email token validation
    EMAIL_VERIFICATION_EXPIRY_HOURS: 48, // Used in email verification token validation
    RATE_LIMIT_LOGIN_ATTEMPTS: 5, // Used in auth middleware for login attempt limiting
    RATE_LIMIT_LOGIN_WINDOW: 15 * 60 * 1000, // Used in auth middleware for rate limit window (15 minutes)
    DEFAULT_TOKEN_LENGTH: 32, // Used in authUtils.ts for secure token generation
    ONE_MINUTE_MS: 60 * 1000, // Used in authUtils.ts for time calculations (1 minute in milliseconds)
    ONE_HOUR_MS: 60 * 60 * 1000, // Used in authUtils.ts for time calculations (1 hour in milliseconds)
    ONE_DAY_MS: 24 * 60 * 60 * 1000, // Used in authUtils.ts for time calculations (24 hours in milliseconds)
    ONE_WEEK_MS: 7 * 24 * 60 * 60 * 1000, // Used in authUtils.ts for time calculations (7 days in milliseconds)
} as const;

// Core authentication form schemas
// Sign in form
export const signInSchema = z.object({
    email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
    password: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD), // Login doesn't need strong password validation
    remember: z.boolean().optional().default(false),
});
export type SignInData = z.infer<typeof signInSchema>;

// Sign up form
export const signUpSchema = z
    .object({
        email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
        password: z
            .string()
            .min(
                VALIDATION_RULES.MIN_PASSWORD_LENGTH,
                ERROR_MESSAGES.WEAK_PASSWORD,
            )
            .regex(
                VALIDATION_RULES.PASSWORD_REGEX,
                ERROR_MESSAGES.WEAK_PASSWORD,
            ),
        confirmPassword: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
        name: z
            .string()
            .min(VALIDATION_RULES.MIN_NAME_LENGTH, ERROR_MESSAGES.INVALID_NAME)
            .max(VALIDATION_RULES.MAX_NAME_LENGTH, ERROR_MESSAGES.INVALID_NAME),
        terms: z.boolean().refine((val) => val === true, {
            message: ERROR_MESSAGES.ACCEPT_TERMS,
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH,
        path: ["confirmPassword"],
    });
export type SignUpData = z.infer<typeof signUpSchema>;

// Password reset request
export const passwordResetRequestSchema = z.object({
    email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
});
export type PasswordResetRequestData = z.infer<
    typeof passwordResetRequestSchema
>;

// Password reset form
export const passwordResetSchema = z
    .object({
        token: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
        password: z
            .string()
            .min(
                VALIDATION_RULES.MIN_PASSWORD_LENGTH,
                ERROR_MESSAGES.WEAK_PASSWORD,
            )
            .regex(
                VALIDATION_RULES.PASSWORD_REGEX,
                ERROR_MESSAGES.WEAK_PASSWORD,
            ),
        confirmPassword: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH,
        path: ["confirmPassword"],
    });
export type PasswordResetData = z.infer<typeof passwordResetSchema>;

// Email verification
export const emailVerificationSchema = z.object({
    token: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
});
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;

// Password change
export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
        newPassword: z
            .string()
            .min(
                VALIDATION_RULES.MIN_PASSWORD_LENGTH,
                ERROR_MESSAGES.WEAK_PASSWORD,
            )
            .regex(
                VALIDATION_RULES.PASSWORD_REGEX,
                ERROR_MESSAGES.WEAK_PASSWORD,
            ),
        confirmNewPassword: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH,
        path: ["confirmNewPassword"],
    });
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

// Session and token schemas
// Session validation
export const sessionUserSchema = z.object({
    id: z.string().uuid(ERROR_MESSAGES.INVALID_UUID),
    email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
    name: z.string(),
    image: z.string().url().optional(),
    role: userRoleSchema,
    emailVerified: z.boolean(),
});

export const sessionSchema = z.object({
    user: sessionUserSchema,
    expires: z.string().datetime(),
});
export type SessionData = z.infer<typeof sessionSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;

// Token validation
export const tokenSchema = z.object({
    token: z.string().min(AUTH_CONSTANTS.DEFAULT_TOKEN_LENGTH),
    type: tokenTypeSchema,
    userId: z.string().uuid(ERROR_MESSAGES.INVALID_UUID).optional(),
    expiresAt: z.date().optional(),
});
export type TokenData = z.infer<typeof tokenSchema>;

// Rate limiting schema
export const rateLimitSchema = z.object({
    identifier: z.string().min(1),
    action: authActionSchema,
    windowMs: z.number().min(0).default(AUTH_CONSTANTS.RATE_LIMIT_LOGIN_WINDOW),
    maxAttempts: z
        .number()
        .min(1)
        .default(AUTH_CONSTANTS.RATE_LIMIT_LOGIN_ATTEMPTS),
});
export type RateLimitData = z.infer<typeof rateLimitSchema>;

// Audit log schema
export const auditLogSchema = z.object({
    action: authActionSchema,
    userId: z.string().uuid(ERROR_MESSAGES.INVALID_UUID).optional(),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().optional(),
    success: z.boolean(),
    timestamp: z.date().default(() => new Date()),
    details: z.record(z.unknown()).optional(),
});
export type AuditLogData = z.infer<typeof auditLogSchema>;

// Permission validation schema
export const permissionCheckSchema = z.object({
    userRole: userRoleSchema,
    requiredRole: userRoleSchema,
    resourceId: z.string().optional(),
});
export type PermissionCheckData = z.infer<typeof permissionCheckSchema>;
