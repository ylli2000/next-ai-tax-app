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
        description: 'Business meals and entertainment',
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
    { name: 'Meals & Entertainment', description: 'Business meals and entertainment', color: '#F59E0B' },
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
    DISPLAY: 'MMM dd, yyyy',
    INPUT: 'yyyy-MM-dd',
    ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
    SHORT: 'MM/dd/yyyy',
    LONG: 'MMMM dd, yyyy',
} as const;

// Currency Constants
export const CURRENCY_CONSTANTS = {
    DEFAULT_CURRENCY: 'USD',
    SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'],
    DECIMAL_PLACES: 2,
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