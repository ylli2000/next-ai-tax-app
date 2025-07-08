import { z } from "zod";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
/**
 * Common validation schemas using Zod
 * Contains reusable enums and validation schemas used across multiple schema files
 */

// Common enums that appear in multiple schema files
export const SortOrderEnum = ["asc", "desc"] as const;
export const sortOrderSchema = z.enum(SortOrderEnum);
export type SortOrder = z.infer<typeof sortOrderSchema>;

// Common severity levels
export const SeverityLevelEnum = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const severityLevelSchema = z.enum(SeverityLevelEnum);
export type SeverityLevel = z.infer<typeof severityLevelSchema>;

// Common status types
export const StatusEnum = ["ERROR", "WARNING", "INFO", "SUCCESS"] as const;
export const statusSchema = z.enum(StatusEnum);
export type Status = z.infer<typeof statusSchema>;

// Auth Type enum
export const AuthTypeEnum = ["Bearer", "API-Key"] as const;
export const authTypeSchema = z.enum(AuthTypeEnum);
export type AuthType = z.infer<typeof authTypeSchema>;

// System Constants
export const SYSTEM_DEFAULT = {} as const;

// Validation rules
export const VALIDATION_RULES = {
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, // One uppercase letter, one lowercase letter, one number
    MIN_PASSWORD_LENGTH: 6, // Used in authUtils.ts and user registration validation
    MAX_NAME_LENGTH: 100, // Used in user profile and supplier name validation
    MIN_NAME_LENGTH: 2, // Used in authUtils.ts for minimum name length validation
    MIN_LINE_ITEM_LENGTH: 1, // Used in invoice line item validation (minimum length)
    MAX_LINE_ITEM_LENGTH: 250, // Used in invoice line item validation (maximum length)
    MAX_DESCRIPTION_LENGTH: 500, // Used in category and invoice description validation
    MIN_AMOUNT: 0.01, // Used in invoice amount validation (minimum valid amount)
    MAX_AMOUNT: 999999.99, // Used in invoice amount validation (maximum valid amount)
    PHONE_NUMBER_REGEX: /^\+?[\d\s\-\(\)]{10,}$/, // Used in phone number validation
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Used in authUtils.ts for email validation
    HEX_COLOR_REGEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, // Used in hex color validation
    /**
     * Invoice number length constraints (for business rules)
     */
    INVOICE_NUMBER_MIN_LENGTH: 2, // Used in invoice number validation (minimum length)
    INVOICE_NUMBER_MAX_LENGTH: 30, // Used in invoice number validation (maximum length)
    INVOICE_REGEX: /^[a-zA-Z0-9\-_]+$/, // Used in invoice number validation (regex)
    TAX_ID_REGEX: /^[A-Z0-9]{1,10}$/, // Used in tax id validation like ABN, ACN etc.(regex)
    OPENAI_FIELD_ID_REGEX: /^[a-zA-Z0-9\-_]+$/, // Used in openai field id validation (regex)
} as const;
