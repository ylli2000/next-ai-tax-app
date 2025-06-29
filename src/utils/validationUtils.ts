import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { z } from 'zod';
import {
  COMMON_DATE_FORMATS,
  CURRENCY_CONSTANTS,
  ERROR_MESSAGES,
  UPLOAD_CONSTANTS,
  VALIDATION_RULES,
} from './constants';

dayjs.extend(customParseFormat);

/**
 * Validation utility functions for the invoice management system
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    // Use zod's email validation for strictness
    return z.string().email().safeParse(email).success;
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} characters long`);
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File): {
    isValid: boolean;
    error?: string;
  } {
    // Check file size
    if (file.size > UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.FILE_TOO_LARGE,
      };
    }

    // Check file type
    if (!(UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!(UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate amount/currency
   */
  static isValidAmount(amount: number | string): {
    isValid: boolean;
    error?: string;
  } {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_AMOUNT,
      };
    }
    
    if (numAmount < VALIDATION_RULES.MIN_AMOUNT) {
      return {
        isValid: false,
        error: `Amount must be at least ${VALIDATION_RULES.MIN_AMOUNT}`,
      };
    }
    
    if (numAmount > VALIDATION_RULES.MAX_AMOUNT) {
      return {
        isValid: false,
        error: `Amount cannot exceed ${VALIDATION_RULES.MAX_AMOUNT}`,
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate currency code
   */
  static isValidCurrency(currency: string): boolean {
    return (CURRENCY_CONSTANTS.SUPPORTED_CURRENCIES as readonly string[]).includes(currency);
  }

  /**
   * Validate required field
   */
  static isRequired(value: unknown): {
    isValid: boolean;
    error?: string;
  } {
    if (value === null || value === undefined || value === '') {
      return {
        isValid: false,
        error: ERROR_MESSAGES.REQUIRED_FIELD,
      };
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      return {
        isValid: false,
        error: ERROR_MESSAGES.REQUIRED_FIELD,
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate string length
   */
  static validateStringLength(
    value: string,
    minLength: number = 0,
    maxLength: number = Number.MAX_SAFE_INTEGER
  ): {
    isValid: boolean;
    error?: string;
  } {
    if (value.length < minLength) {
      return {
        isValid: false,
        error: `Must be at least ${minLength} characters long`,
      };
    }
    
    if (value.length > maxLength) {
      return {
        isValid: false,
        error: `Must be no more than ${maxLength} characters long`,
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate phone number (basic format)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate date string
   */
  static isValidDate(dateString: string): {
    isValid: boolean;
    error?: string;
  } {
    for (const format of COMMON_DATE_FORMATS) {
      const d = dayjs(dateString, format, true);
      if (d.isValid() && d.format(format) === dateString) {
        return { isValid: true };
      }
    }
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_DATE,
    };
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitize HTML input
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate hex color
   */
  static isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * Validate array has minimum items
   */
  static validateArrayMinLength<T>(
    array: T[],
    minLength: number
  ): {
    isValid: boolean;
    error?: string;
  } {
    if (!Array.isArray(array) || array.length < minLength) {
      return {
        isValid: false,
        error: `Must have at least ${minLength} item${minLength !== 1 ? 's' : ''}`,
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate invoice number format
   */
  static isValidInvoiceNumber(invoiceNumber: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!invoiceNumber || invoiceNumber.length < VALIDATION_RULES.INVOICE_NUMBER_MIN_LENGTH || invoiceNumber.length > VALIDATION_RULES.INVOICE_NUMBER_MAX_LENGTH) {
      return {
        isValid: false,
        error: `Invoice number must be between ${VALIDATION_RULES.INVOICE_NUMBER_MIN_LENGTH} and ${VALIDATION_RULES.INVOICE_NUMBER_MAX_LENGTH} characters`,
      };
    }
    const invoiceNumberRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!invoiceNumberRegex.test(invoiceNumber)) {
      return {
        isValid: false,
        error: 'Invoice number can only contain letters, numbers, hyphens, and underscores',
      };
    }
    return { isValid: true };
  }

  /**
   * Validate tax rate (0-100%)
   */
  static isValidTaxRate(taxRate: number): {
    isValid: boolean;
    error?: string;
  } {
    if (typeof taxRate !== 'number' || !isFinite(taxRate) || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      return {
        isValid: false,
        error: 'Tax rate must be between 0 and 100%',
      };
    }
    return { isValid: true };
  }
}

/**
 * Common validation schemas using Zod
 */
export const validationSchemas = {
  email: z.string().email('Invalid email format'),
  
  password: z.string()
    .min(VALIDATION_RULES.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  
  amount: z.number()
    .min(VALIDATION_RULES.MIN_AMOUNT, `Amount must be at least ${VALIDATION_RULES.MIN_AMOUNT}`)
    .max(VALIDATION_RULES.MAX_AMOUNT, `Amount cannot exceed ${VALIDATION_RULES.MAX_AMOUNT}`),
  
  currency: z.enum(CURRENCY_CONSTANTS.SUPPORTED_CURRENCIES as unknown as [string, ...string[]]),
  
  uuid: z.string().uuid('Invalid UUID format'),
  
  url: z.string().url('Invalid URL format'),
  
  phoneNumber: z.string().regex(
    /^\+?[\d\s\-\(\)]{10,}$/,
    'Invalid phone number format'
  ),
  
  hexColor: z.string().regex(
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    'Invalid hex color format'
  ),
  
  invoiceNumber: z.string()
    .min(1, 'Invoice number is required')
    .max(50, 'Invoice number must be no more than 50 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invoice number can only contain letters, numbers, hyphens, and underscores'),
  
  taxRate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%'),
  
  name: z.string()
    .min(1, 'Name is required')
    .max(VALIDATION_RULES.MAX_NAME_LENGTH, `Name must be no more than ${VALIDATION_RULES.MAX_NAME_LENGTH} characters`),
  
  description: z.string()
    .max(VALIDATION_RULES.MAX_DESCRIPTION_LENGTH, `Description must be no more than ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
};

/**
 * Form validation helper
 */
export const validateForm = <T extends Record<string, unknown>>(
  data: T,
  schema: z.ZodSchema<T>
): {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
} => {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      errors: {},
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        isValid: false,
        errors,
      };
    }
    
    return {
      isValid: false,
      errors: { _form: 'Validation failed' },
    };
  }
};

/**
 * Async validation helper for unique constraints
 */
export const createAsyncValidator = <T>(
  validationFn: (value: T) => Promise<boolean>,
  errorMessage: string
) => {
  return async (value: T): Promise<{ isValid: boolean; error?: string }> => {
    try {
      const isValid = await validationFn(value);
      return isValid
        ? { isValid: true }
        : { isValid: false, error: errorMessage };
    } catch {
      return { isValid: false, error: errorMessage };
    }
  };
}; 