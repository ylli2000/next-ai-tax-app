import type { InvoiceCategory } from '../types/invoiceSchema';

// System Constants
export const SYSTEM_CONSTANTS = {
    DEFAULT_ADMIN_EMAIL: 'admin@example.com', // Used in seed.ts for creating admin user
    DEFAULT_ADMIN_NAME: 'System Administrator', // Used in seed.ts for admin display name
    DEFAULT_LANGUAGE: 'en', // Used in user profile initialization and i18n setup
    DEFAULT_CURRENCY: 'USD', // Legacy fallback, overridden by CURRENCY_CONSTANTS.DEFAULT_CURRENCY
    DEFAULT_THEME: 'SYSTEM', // Used in UI theme provider for system preference detection
    DEFAULT_USER_ROLE: 'USER', // Used in user registration and role assignment
    DEFAULT_INVOICE_STATUS: 'PENDING', // Used in invoice creation and status initialization
    DEFAULT_UPLOAD_STATUS: 'UPLOADING', // Used in file upload progress tracking
    DEFAULT_VALIDATION_STATUS: 'PENDING', // Used in AI validation workflow
    DEFAULT_CATEGORY_IS_DEFAULT: 'false', // Used in category creation for custom vs default categories
    DEFAULT_NOTIFICATIONS_ENABLED: true, // Used in user preference initialization
} as const;

// File Size Constants
export const FILE_SIZE_CONSTANTS = {
    BYTES_PER_KB: 1024, // Used in formatUtils.ts for file size calculations
    BYTES_PER_MB: 1024 * 1024, // Used in formatUtils.ts and upload validation
    BYTES_PER_GB: 1024 * 1024 * 1024, // Used in formatUtils.ts for large file display
    DEFAULT_MAX_SIZE_MB: 5, // Used in file upload validation and UI limits
    get DEFAULT_MAX_SIZE_BYTES() { // Used in upload API routes for size validation
        return this.DEFAULT_MAX_SIZE_MB * this.BYTES_PER_MB;
    },
} as const;

// Database Precision Constants
export const DB_PRECISION_CONSTANTS = {
    DECIMAL_PRECISION: 12, // Used in Drizzle ORM decimal columns for invoice amounts
    DECIMAL_SCALE: 2, // Used in Drizzle ORM for currency decimal places (e.g., $12.34)
    TAX_RATE_PRECISION: 5, // Used in Drizzle ORM for tax rate storage (e.g., 10.25%)
    TAX_RATE_SCALE: 4, // Used in Drizzle ORM for tax rate decimal precision
    CONFIDENCE_PRECISION: 5, // Used in Drizzle ORM for AI confidence scores (0.9999)
    CONFIDENCE_SCALE: 4, // Used in Drizzle ORM for AI confidence decimal places
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
    get MAX_FILE_SIZE() { // Used in upload API validation and UI file size checks
        return FILE_SIZE_CONSTANTS.DEFAULT_MAX_SIZE_BYTES;
    },
    ALLOWED_MIME_TYPES: [ // Used in upload API validation and file type checking
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/bmp',
        'image/gif'
    ],
    ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.bmp', '.gif'], // Used in file validation and UI file picker
    DEFAULT_ALLOWED_TYPES_STRING: 'application/pdf,image/png,image/jpeg,image/jpg,image/bmp,image/gif', // Used in HTML input accept attribute
} as const;

// UI Constants
export const UI_CONSTANTS = {
    TOAST_DURATION: 5000, // Used in toast notifications for auto-dismiss timing (ms)
    ANIMATION_DURATION: 300, // Used in UI transitions and loading animations (ms)
    DEBOUNCE_DELAY: 300, // Used in search inputs and form validation debouncing (ms)
    PAGINATION_DEFAULT_SIZE: 20, // Used in data tables and list pagination default page size
    PAGINATION_SIZE_OPTIONS: [10, 20, 50, 100], // Used in pagination size selector dropdown
} as const;

// API Constants
export const API_CONSTANTS = {
    DEFAULT_TIMEOUT: 30000, // Used in API client and fetch requests timeout (ms)
    RETRY_ATTEMPTS: 3, // Used in apiUtils.ts for failed request retry logic
    RATE_LIMIT_WINDOW: 60000, // Used in API middleware for rate limiting window (1 minute)
    RATE_LIMIT_MAX: 100, // Used in API middleware for max requests per window
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
    DEFAULT_CURRENCY: 'AUD', // Used in formatUtils.ts and invoice creation default
    DEFAULT_CURRENCY_LOCALE: 'en-US', // Used in Intl.NumberFormat for currency display
    SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'], // Used in currency dropdown and validation
    DECIMAL_PLACES: 2, // Used in formatUtils.ts for currency decimal formatting
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
    GST_RATE_PERCENTAGE: 10, // Used in tax calculations and GST validation
    ABN_REGEX: /^\d{11}$/, // Used in supplier ABN validation and form validation
    // Australian Financial Year constants (July 1 - June 30) - used in dateUtils.ts and reporting
    FINANCIAL_YEAR: {
        START_MONTH: 7, // Used in dateUtils.ts getAustralianFinancialYear functions
        START_DAY: 1, // Used in financial year range calculations
        END_MONTH: 6, // Used in dateUtils.ts getAustralianFinancialYear functions  
        END_DAY: 30, // Used in financial year range calculations
    },
    // Note: International invoices may show foreign taxes (VAT, Sales Tax, etc.) 
    // but these cannot be claimed as tax deductions in Australian tax returns
} as const;

// App Routes
export const ROUTES = {
    HOME: '/', // Used in navigation components and redirects
    DASHBOARD: '/dashboard', // Used in navigation and dashboard page routing
    INVOICES: '/invoices', // Used in invoice list navigation and links
    UPLOAD: '/upload', // Used in file upload navigation and form actions
    SETTINGS: '/settings', // Used in user settings navigation
    PROFILE: '/profile', // Used in user profile navigation
    AUTH: {
        SIGNIN: '/auth/signin', // Used in authentication redirects and login forms
        SIGNUP: '/auth/signup', // Used in registration forms and auth navigation
        SIGNOUT: '/auth/signout', // Used in logout actions and auth middleware
    },
    API: {
        UPLOAD: '/api/upload', // Used in file upload form actions and API calls
        INVOICES: '/api/invoices', // Used in invoice CRUD operations and data fetching
        AI_EXTRACT: '/api/ai/extract', // Used in AI processing API calls
        EXPORT: '/api/export', // Used in data export functionality
    }
} as const;

// Environment-specific constants
export const ENV_CONSTANTS = {
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development', // Used for dev-only features and debug logging
    IS_PRODUCTION: process.env.NODE_ENV === 'production', // Used for production optimizations and error handling
    IS_TEST: process.env.NODE_ENV === 'test', // Used in test configurations and mock data
} as const;

// Auth constants
export const AUTH_CONSTANTS = {
  BCRYPT_ROUNDS: 12, // Used in authUtils.ts for password hashing strength
  SESSION_MAX_AGE: 60 * 24, // Used in NextAuth configuration for session duration (24 hours in minutes)
  TOKEN_EXPIRY_HOURS: 24, // Used in JWT token generation and validation
  PASSWORD_RESET_EXPIRY_HOURS: 2, // Used in password reset email token validation
  EMAIL_VERIFICATION_EXPIRY_HOURS: 48, // Used in email verification token validation
  RATE_LIMIT_LOGIN_ATTEMPTS: 5, // Used in auth middleware for login attempt limiting
  RATE_LIMIT_LOGIN_WINDOW: 15 * 60 * 1000, // Used in auth middleware for rate limit window (15 minutes)
} as const;

// OpenAI constants
export const OPENAI_CONSTANTS = {
  MAX_TOKENS: 4000, // Used in OpenAI API calls for response length limiting
  TEMPERATURE: 0.1, // Used in OpenAI API calls for response consistency (low creativity)
  MODEL: 'gpt-4o' as const, // Used in OpenAI text processing API calls
  VISION_MODEL: 'gpt-4o' as const, // Used in OpenAI image/invoice processing API calls
  MAX_RETRY_ATTEMPTS: 3, // Used in aiUtils.ts for failed API call retries
  RETRY_DELAY_MS: 1000, // Used in aiUtils.ts for retry delay timing
} as const;

// Email constants
export const EMAIL_CONSTANTS = {
  MAX_SUBJECT_LENGTH: 200, // Used in email validation and template rendering
  MAX_BODY_LENGTH: 10000, // Used in email validation and template rendering
  RETRY_ATTEMPTS: 3, // Used in email service for failed send retries
  RETRY_DELAY_MS: 2000, // Used in email service for retry delay timing
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
  DEFAULT_THEME: 'system' as const, // Used in theme provider initialization and user preferences
  AVAILABLE_THEMES: ['light', 'dark', 'system'] as const, // Used in theme selector dropdown and validation
} as const;

// Language constants
export const LANGUAGE_CONSTANTS = {
  DEFAULT_LANGUAGE: 'en' as const, // Used in i18n initialization and user preferences
  AVAILABLE_LANGUAGES: ['en', 'zh'] as const, // Used in language selector dropdown and validation
} as const;

// Search constants
export const SEARCH_CONSTANTS = {
  MIN_SEARCH_LENGTH: 2, // Used in search input validation and filtering
  MAX_SEARCH_LENGTH: 100, // Used in search input validation and API limits
  SEARCH_DEBOUNCE: 300, // Used in search input debouncing to prevent excessive API calls
} as const;

// Export formats
export const EXPORT_FORMATS = {
  EXCEL: 'xlsx', // Used in exportUtils.ts and export API for Excel file generation
  CSV: 'csv', // Used in exportUtils.ts and export API for CSV file generation
} as const;

// Status colors for UI - Used in invoice status badges, charts, and status indicators
export const STATUS_COLORS = {
  pending: '#F59E0B',      // amber-500 - Used for pending invoice status styling
  processed: '#10B981',    // emerald-500 - Used for processed invoice status styling
  failed: '#EF4444',       // red-500 - Used for failed invoice status styling
  reviewing: '#8B5CF6',    // violet-500 - Used for reviewing invoice status styling
} as const;

// Invoice status workflow - Used in status transition validation and UI workflow controls
export const INVOICE_STATUS_WORKFLOW = {
  pending: ['processed', 'failed'], // Used to validate allowed status transitions from pending
  processed: ['reviewing'], // Used to validate allowed status transitions from processed
  reviewing: ['processed'], // Used to validate allowed status transitions from reviewing
  failed: ['pending'], // Used to validate allowed status transitions from failed
} as const;

// Validation rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8, // Used in authUtils.ts and user registration validation
  MAX_NAME_LENGTH: 100, // Used in user profile and supplier name validation
  MAX_DESCRIPTION_LENGTH: 500, // Used in category and invoice description validation
  MIN_AMOUNT: 0.01, // Used in invoice amount validation (minimum valid amount)
  MAX_AMOUNT: 999999.99, // Used in invoice amount validation (maximum valid amount)
  /**
   * Invoice number length constraints (for business rules)
   */
  INVOICE_NUMBER_MIN_LENGTH: 2, // Used in invoice number validation (minimum length)
  INVOICE_NUMBER_MAX_LENGTH: 30, // Used in invoice number validation (maximum length)
} as const; 