import { createId } from '@paralleldrive/cuid2';
import { decimal, integer, json, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { DB_PRECISION_CONSTANTS, SYSTEM_CONSTANTS } from '../../utils/constants';
import { users } from './users';

export const invoiceStatusEnum = pgEnum('invoice_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED']);
export const invoiceCategoryEnum = pgEnum('invoice_category', [
    'OFFICE_SUPPLIES',
    'TRAVEL_TRANSPORT', 
    'MEALS_ENTERTAINMENT',
    'SOFTWARE_TECH',
    'RENT_UTILITIES',
    'UTILITIES',
    'COMMUNICATIONS',
    'REPAIRS_MAINTENANCE',
    'TRAINING_EDUCATION',
    'FINANCIAL_SERVICES',
    'MARKETING_ADVERTISING',
    'LEGAL_CONSULTING',
    'OTHER'
]);
export const validationStatusEnum = pgEnum('validation_status', ['PENDING', 'VALID', 'INVALID', 'NEEDS_REVIEW']);
export const uploadStatusEnum = pgEnum('upload_status', ['UPLOADING', 'UPLOADED', 'FAILED']);

export const invoiceFiles = pgTable('invoice_files', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    originalName: text('original_name').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),
    openaiFileId: text('openai_file_id'),
    uploadStatus: uploadStatusEnum('upload_status').notNull().default(SYSTEM_CONSTANTS.DEFAULT_UPLOAD_STATUS),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    fileId: text('file_id').notNull().references(() => invoiceFiles.id, { onDelete: 'cascade' }),
    
    // Basic invoice information
    invoiceNumber: text('invoice_number'),
    supplierName: text('supplier_name'),
    supplierAddress: text('supplier_address'),
    supplierTaxId: text('supplier_tax_id'),
    
    // Financial information
    subtotal: decimal('subtotal', { 
        precision: DB_PRECISION_CONSTANTS.DECIMAL_PRECISION, 
        scale: DB_PRECISION_CONSTANTS.DECIMAL_SCALE 
    }),
    taxAmount: decimal('tax_amount', { 
        precision: DB_PRECISION_CONSTANTS.DECIMAL_PRECISION, 
        scale: DB_PRECISION_CONSTANTS.DECIMAL_SCALE 
    }),
    taxRate: decimal('tax_rate', { 
        precision: DB_PRECISION_CONSTANTS.TAX_RATE_PRECISION, 
        scale: DB_PRECISION_CONSTANTS.TAX_RATE_SCALE 
    }),
    totalAmount: decimal('total_amount', { 
        precision: DB_PRECISION_CONSTANTS.DECIMAL_PRECISION, 
        scale: DB_PRECISION_CONSTANTS.DECIMAL_SCALE 
    }),
    currency: text('currency').default(SYSTEM_CONSTANTS.DEFAULT_CURRENCY),
    
    // Dates
    invoiceDate: timestamp('invoice_date'),
    dueDate: timestamp('due_date'),
    
    // Categorization
    category: invoiceCategoryEnum('category'),
    customCategory: text('custom_category'),
    
    // AI Processing
    extractedData: json('extracted_data'),
    aiConfidenceScore: decimal('ai_confidence_score', { 
        precision: DB_PRECISION_CONSTANTS.CONFIDENCE_PRECISION, 
        scale: DB_PRECISION_CONSTANTS.CONFIDENCE_SCALE 
    }),
    validationStatus: validationStatusEnum('validation_status').notNull().default(SYSTEM_CONSTANTS.DEFAULT_VALIDATION_STATUS),
    validationErrors: json('validation_errors'),
    
    // Status and metadata
    status: invoiceStatusEnum('status').notNull().default(SYSTEM_CONSTANTS.DEFAULT_INVOICE_STATUS),
    notes: text('notes'),
    tags: json('tags'),
    
    // Audit trail
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
});

export const categories = pgTable('categories', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color'),
    isDefault: text('is_default').notNull().default(SYSTEM_CONSTANTS.DEFAULT_CATEGORY_IS_DEFAULT),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 