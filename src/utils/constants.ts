import type { InvoiceCategory } from '../types/invoiceSchema';

// System Constants
export const SYSTEM_CONSTANTS = {
    DEFAULT_ADMIN_EMAIL: 'admin@example.com',
    DEFAULT_ADMIN_NAME: 'System Administrator',
    DEFAULT_LANGUAGE: 'en',
    DEFAULT_CURRENCY: 'USD',
    DEFAULT_THEME: 'SYSTEM',
    DEFAULT_USER_ROLE: 'USER',
    DEFAULT_INVOICE_STATUS: 'PENDING',
    DEFAULT_UPLOAD_STATUS: 'UPLOADING',
    DEFAULT_VALIDATION_STATUS: 'PENDING',
    DEFAULT_CATEGORY_IS_DEFAULT: 'false',
    DEFAULT_NOTIFICATIONS_ENABLED: true,
} as const;

// File Size Constants
export const FILE_SIZE_CONSTANTS = {
    BYTES_PER_KB: 1024,
    BYTES_PER_MB: 1024 * 1024,
    BYTES_PER_GB: 1024 * 1024 * 1024,
    DEFAULT_MAX_SIZE_MB: 5,
    get DEFAULT_MAX_SIZE_BYTES() {
        return this.DEFAULT_MAX_SIZE_MB * this.BYTES_PER_MB;
    },
} as const;

// Database Precision Constants
export const DB_PRECISION_CONSTANTS = {
    DECIMAL_PRECISION: 12,
    DECIMAL_SCALE: 2,
    TAX_RATE_PRECISION: 5,
    TAX_RATE_SCALE: 4,
    CONFIDENCE_PRECISION: 5,
    CONFIDENCE_SCALE: 4,
} as const;

// Invoice Categories
export const INVOICE_CATEGORIES: Record<InvoiceCategory, { label: string; description: string; color: string }> = {
    OFFICE_SUPPLIES: {
        label: 'Office Supplies',
        description: 'Office equipment and supplies',
        color: '#3B82F6'
    },
    TRAVEL_TRANSPORT: {
        label: 'Travel & Transport',
        description: 'Business travel expenses',
        color: '#10B981'
    },
    MEALS_ENTERTAINMENT: {
        label: 'Meals & Entertainment',
        description: 'Business meals and entertainment (limited deductibility in Australia)',
        color: '#F59E0B'
    },
    SOFTWARE_TECH: {
        label: 'Software & Technology',
        description: 'Software licenses and tech equipment',
        color: '#8B5CF6'
    },
    RENT_UTILITIES: {
        label: 'Rent & Utilities',
        description: 'Office rent and utilities',
        color: '#EF4444'
    },
    UTILITIES: {
        label: 'Utilities',
        description: 'Water, electricity, gas bills',
        color: '#F97316'
    },
    COMMUNICATIONS: {
        label: 'Communications',
        description: 'Phone and internet services',
        color: '#06B6D4'
    },
    REPAIRS_MAINTENANCE: {
        label: 'Repairs & Maintenance',
        description: 'Equipment repairs and maintenance',
        color: '#84CC16'
    },
    TRAINING_EDUCATION: {
        label: 'Training & Education',
        description: 'Professional development and training',
        color: '#F97316'
    },
    FINANCIAL_SERVICES: {
        label: 'Financial Services',
        description: 'Banking and financial fees',
        color: '#EC4899'
    },
    MARKETING_ADVERTISING: {
        label: 'Marketing & Advertising',
        description: 'Marketing and promotional expenses',
        color: '#6366F1'
    },
    LEGAL_CONSULTING: {
        label: 'Legal & Consulting',
        description: 'Legal and consulting services',
        color: '#14B8A6'
    },
    OTHER: {
        label: 'Other',
        description: 'Miscellaneous business expenses',
        color: '#6B7280'
    }
};

// Default Categories for Seeding (array format for easier iteration)
export const DEFAULT_CATEGORIES_SEED = [
    { name: 'Office Supplies', description: 'Office equipment and supplies', color: '#3B82F6' },
    { name: 'Travel & Transport', description: 'Business travel expenses', color: '#10B981' },
    { name: 'Meals & Entertainment', description: 'Business meals and entertainment (limited deductibility in Australia)', color: '#F59E0B' },
    { name: 'Software & Technology', description: 'Software licenses and tech equipment', color: '#8B5CF6' },
    { name: 'Rent & Utilities', description: 'Office rent and utilities', color: '#EF4444' },
    { name: 'Communications', description: 'Phone and internet services', color: '#06B6D4' },
    { name: 'Repairs & Maintenance', description: 'Equipment repairs and maintenance', color: '#84CC16' },
    { name: 'Training & Education', description: 'Professional development and training', color: '#F97316' },
    { name: 'Financial Services', description: 'Banking and financial fees', color: '#EC4899' },
    { name: 'Marketing & Advertising', description: 'Marketing and promotional expenses', color: '#6366F1' },
    { name: 'Legal & Consulting', description: 'Legal and consulting services', color: '#14B8A6' },
    { name: 'Other', description: 'Miscellaneous business expenses', color: '#6B7280' },
] as const;

// File Upload Constants
export const UPLOAD_CONSTANTS = {
    get MAX_FILE_SIZE() {
        return FILE_SIZE_CONSTANTS.DEFAULT_MAX_SIZE_BYTES;
    },
    ALLOWED_MIME_TYPES: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/bmp',
        'image/gif'
    ],
    ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.bmp', '.gif'],
    DEFAULT_ALLOWED_TYPES_STRING: 'application/pdf,image/png,image/jpeg,image/jpg,image/bmp,image/gif',
} as const;

// UI Constants
export const UI_CONSTANTS = {
    TOAST_DURATION: 5000,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    PAGINATION_DEFAULT_SIZE: 20,
    PAGINATION_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// API Constants
export const API_CONSTANTS = {
    DEFAULT_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX: 100,
} as const;

// Date Format Constants
export const DATE_FORMATS = {
    DISPLAY: 'DD/MM/YYYY',         // For display in UI (dayjs)
    INPUT: 'YYYY-MM-DD',           // For HTML <input type="date"> value format (dayjs)
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSS[Z]', // For ISO string (dayjs)
    SHORT: 'DD/MM/YYYY',           // For short display/table (dayjs)
    LONG: 'D MMMM YYYY',           // For long display, e.g. 5 June 2024 (dayjs)
    FILE_NAME: 'YYYY-MM-DD_HH-mm-ss-SSS',      // For file name safe date string (dayjs)
} as const;

// Common date formats for parsing
export const COMMON_DATE_FORMATS = [
    "YYYY-MM-DD'T'HH:mm:ss.SSS[Z]", // ISO string
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'DD-MM-YYYY',
    'MM-DD-YYYY',
    'YYYY/MM/DD',
    'D MMM YYYY',
    'DD MMM YYYY',
    'D MMMM YYYY',
    'DD MMMM YYYY',
  ] as const;

// Currency Constants - Default to AUD for Australian users, but supports international invoices
export const CURRENCY_CONSTANTS = {
    DEFAULT_CURRENCY: 'AUD', // Default for Australian users
    DEFAULT_CURRENCY_LOCALE: 'en-US', // en-US locale makes AUD display as A$1,234.56
    SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'],
    DECIMAL_PLACES: 2,
    // Currency display examples with Intl.NumberFormat:
    // USD: $1,234.56 (US Dollar)
    // AUD: A$1,234.56 (Australian Dollar) 
    // GBP: £1,234.56 (British Pound)
    // EUR: €1,234.56 (Euro)
    // JPY: ¥1,235 (Japanese Yen - no decimals)
    // CNY: CN¥1,234.56 (Chinese Yuan)
} as const;

// Australian Tax Constants - Only Australian GST is deductible for Australian tax reporting
export const AUSTRALIAN_TAX_CONSTANTS = {
    GST_RATE_PERCENTAGE: 10, // Australian GST rate (10%) - only applicable to Australian suppliers
    ABN_REGEX: /^\d{11}$/, // ABN format validation (11 digits) for Australian suppliers
    // Australian Financial Year constants (July 1 - June 30) - used for Australian tax reporting
    FINANCIAL_YEAR: {
        START_MONTH: 7, // July
        START_DAY: 1,
        END_MONTH: 6, // June  
        END_DAY: 30,
    },
    // Note: International invoices may show foreign taxes (VAT, Sales Tax, etc.) 
    // but these cannot be claimed as tax deductions in Australian tax returns
} as const;

// App Routes
export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    INVOICES: '/invoices',
    UPLOAD: '/upload',
    SETTINGS: '/settings',
    PROFILE: '/profile',
    AUTH: {
        SIGNIN: '/auth/signin',
        SIGNUP: '/auth/signup',
        SIGNOUT: '/auth/signout',
    },
    API: {
        UPLOAD: '/api/upload',
        INVOICES: '/api/invoices',
        AI_EXTRACT: '/api/ai/extract',
        EXPORT: '/api/export',
    }
} as const;

// Environment-specific constants
export const ENV_CONSTANTS = {
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_TEST: process.env.NODE_ENV === 'test',
} as const;

// Auth constants
export const AUTH_CONSTANTS = {
  BCRYPT_ROUNDS: 12,
  SESSION_MAX_AGE: 60 * 24, // 24 hours in minutes
  TOKEN_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 2,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 48,
  RATE_LIMIT_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
} as const;

// OpenAI constants
export const OPENAI_CONSTANTS = {
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.1,
  MODEL: 'gpt-4o' as const,
  VISION_MODEL: 'gpt-4o' as const,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// Email constants
export const EMAIL_CONSTANTS = {
  MAX_SUBJECT_LENGTH: 200,
  MAX_BODY_LENGTH: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  INVOICE_UPLOADED: 'Invoice uploaded and processed successfully!',
  INVOICE_UPDATED: 'Invoice updated successfully!',
  INVOICE_DELETED: 'Invoice deleted successfully!',
  CATEGORY_CREATED: 'Category created successfully!',
  CATEGORY_UPDATED: 'Category updated successfully!',
  CATEGORY_DELETED: 'Category deleted successfully!',
  EXPORT_COMPLETED: 'Export completed successfully!',
  EMAIL_SENT: 'Email sent successfully!',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // File upload errors
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB',
  INVALID_FILE_TYPE: 'Invalid file type. Only PDF, JPG, and PNG files are allowed',
  UPLOAD_FAILED: 'File upload failed. Please try again',
  
  // AI processing errors
  AI_PROCESSING_FAILED: 'Failed to process invoice with AI. Please try again',
  INVALID_INVOICE_FORMAT: 'Invalid invoice format detected',
  EXTRACTION_FAILED: 'Failed to extract invoice information',
  
  // Database errors
  DATABASE_ERROR: 'Database operation failed',
  RECORD_NOT_FOUND: 'Record not found',
  DUPLICATE_RECORD: 'Record already exists',
  
  // Authentication errors
  UNAUTHORIZED: 'You are not authorized to perform this action',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  INVALID_CREDENTIALS: 'Invalid credentials provided',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before signing in',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed login attempts',
  WEAK_PASSWORD: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character',
  USER_NOT_FOUND: 'User not found',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid or malformed token',
  PERMISSION_DENIED: 'You do not have permission to access this resource',
  AUTHENTICATION_FAILED: 'Authentication failed. Please try again',
  
  // Validation errors
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_AMOUNT: 'Invalid amount. Must be a positive number',
  INVALID_DATE: 'Invalid date format',
  
  // API errors
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  SERVER_ERROR: 'Internal server error. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  
  // Export errors
  EXPORT_FAILED: 'Export failed. Please try again',
  NO_DATA_TO_EXPORT: 'No data available for export',
  
  // Email errors
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again',
  INVALID_EMAIL_TEMPLATE: 'Invalid email template',
} as const;

// Theme constants
export const THEME_CONSTANTS = {
  DEFAULT_THEME: 'system' as const,
  AVAILABLE_THEMES: ['light', 'dark', 'system'] as const,
} as const;

// Language constants
export const LANGUAGE_CONSTANTS = {
  DEFAULT_LANGUAGE: 'en' as const,
  AVAILABLE_LANGUAGES: ['en', 'zh'] as const,
} as const;

// Search constants
export const SEARCH_CONSTANTS = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  SEARCH_DEBOUNCE: 300,
} as const;

// Export formats
export const EXPORT_FORMATS = {
  EXCEL: 'xlsx',
  CSV: 'csv',
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  pending: '#F59E0B',      // amber-500
  processed: '#10B981',    // emerald-500
  failed: '#EF4444',       // red-500
  reviewing: '#8B5CF6',    // violet-500
} as const;

// Invoice status workflow
export const INVOICE_STATUS_WORKFLOW = {
  pending: ['processed', 'failed'],
  processed: ['reviewing'],
  reviewing: ['processed'],
  failed: ['pending'],
} as const;

// Validation rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999.99,
  /**
   * Invoice number length constraints (for business rules)
   */
  INVOICE_NUMBER_MIN_LENGTH: 2, // Minimum invoice number length
  INVOICE_NUMBER_MAX_LENGTH: 30, // Maximum invoice number length
} as const; 