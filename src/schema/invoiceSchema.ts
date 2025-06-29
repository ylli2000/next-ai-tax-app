import { createId } from '@paralleldrive/cuid2';
import { decimal, integer, json, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { DB_PRECISION_CONSTANTS, SYSTEM_CONSTANTS } from '../utils/constants';
import { users } from './userSchema';

export const InvoiceStatusEnum = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED'] as const;
export const invoiceStatusSchema = z.enum(InvoiceStatusEnum);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const InvoiceCategoryEnum = [
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
] as const;
export const invoiceCategorySchema = z.enum(InvoiceCategoryEnum);
export type InvoiceCategory = z.infer<typeof invoiceCategorySchema>;

export const ValidationStatusEnum = ['PENDING', 'VALID', 'INVALID', 'NEEDS_REVIEW'] as const;
export const validationStatusSchema = z.enum(ValidationStatusEnum);
export type ValidationStatus = z.infer<typeof validationStatusSchema>;

export const UploadStatusEnum = ['UPLOADING', 'UPLOADED', 'FAILED'] as const;
export const uploadStatusSchema = z.enum(UploadStatusEnum);
export type UploadStatus = z.infer<typeof uploadStatusSchema>;

export const invoiceStatusEnum = pgEnum('invoice_status', InvoiceStatusEnum);
export const invoiceCategoryEnum = pgEnum('invoice_category', InvoiceCategoryEnum);
export const validationStatusEnum = pgEnum('validation_status', ValidationStatusEnum);
export const uploadStatusEnum = pgEnum('upload_status', UploadStatusEnum);

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

export const selectInvoiceFileSchema = createSelectSchema(invoiceFiles);
export const insertInvoiceFileSchema = createInsertSchema(invoiceFiles);
export type InvoiceFile = typeof invoiceFiles.$inferSelect;

export const selectInvoiceSchema = createSelectSchema(invoices);
export const insertInvoiceSchema = createInsertSchema(invoices);
export type Invoice = typeof invoices.$inferSelect;

export const selectCategorySchema = createSelectSchema(categories);
export const insertCategorySchema = createInsertSchema(categories);
export type Category = typeof categories.$inferSelect;

export const createInvoiceDataSchema = z.object({
    userId: z.string(),
    fileId: z.string(),
    status: invoiceStatusSchema.optional(),
});
export type CreateInvoiceData = z.infer<typeof createInvoiceDataSchema>;

export const updateInvoiceDataSchema = z.object({
    invoiceNumber: z.string().optional(),
    supplierName: z.string().optional(),
    supplierAddress: z.string().optional(),
    supplierTaxId: z.string().optional(),
    subtotal: z.number().optional(),
    taxAmount: z.number().optional(),
    taxRate: z.number().optional(),
    totalAmount: z.number().optional(),
    currency: z.string().optional(),
    invoiceDate: z.date().optional(),
    dueDate: z.date().optional(),
    category: invoiceCategorySchema.optional(),
    customCategory: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: invoiceStatusSchema.optional(),
});
export type UpdateInvoiceData = z.infer<typeof updateInvoiceDataSchema>;

export const invoiceListFiltersSchema = z.object({
    category: invoiceCategorySchema.optional(),
    status: invoiceStatusSchema.optional(),
    supplierName: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    amountMin: z.number().optional(),
    amountMax: z.number().optional(),
    tags: z.array(z.string()).optional(),
});
export type InvoiceListFilters = z.infer<typeof invoiceListFiltersSchema>;

export const invoiceListSortSchema = z.object({
    field: z.enum(['invoiceDate', 'totalAmount', 'supplierName', 'createdAt', 'updatedAt']),
    direction: z.enum(['asc', 'desc']),
});
export type InvoiceListSort = z.infer<typeof invoiceListSortSchema>;

export const invoiceStatsSchema = z.object({
    totalAmount: z.number(),
    totalCount: z.number().int(),
    categoryBreakdown: z.record(invoiceCategorySchema, z.object({
        count: z.number().int(),
        amount: z.number(),
    })),
    monthlyTrend: z.array(z.object({
        month: z.string(),
        amount: z.number(),
        count: z.number().int(),
    })),
    topSuppliers: z.array(z.object({
        name: z.string(),
        amount: z.number(),
        count: z.number().int(),
    })),
});
export type InvoiceStats = z.infer<typeof invoiceStatsSchema>; 