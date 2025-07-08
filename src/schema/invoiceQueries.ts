import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { SortOrderEnum } from "./commonSchemas";
import { invoiceCategorySchema, invoiceStatusSchema } from "./invoiceSchema";
import { invoiceFiles, invoices } from "./invoiceTables";

export const selectInvoiceFileSchema = createSelectSchema(invoiceFiles);
export const insertInvoiceFileSchema = createInsertSchema(invoiceFiles);
//export type InvoiceFile from invoiceTables.ts
export const selectInvoiceSchema = createSelectSchema(invoices);
export const insertInvoiceSchema = createInsertSchema(invoices);
//export type Invoice from invoiceTables.ts

// Create Invoice Data
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
    description: z.string().optional(),
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
    description: z.string().optional(),
});
export type InvoiceListFilters = z.infer<typeof invoiceListFiltersSchema>;

export const invoiceListSortSchema = z.object({
    field: z.enum([
        "invoiceDate",
        "totalAmount",
        "supplierName",
        "createdAt",
        "updatedAt",
    ]),
    direction: z.enum(SortOrderEnum),
});
export type InvoiceListSort = z.infer<typeof invoiceListSortSchema>;

export const invoiceStatsSchema = z.object({
    totalAmount: z.number(),
    totalCount: z.number().int(),
    categoryBreakdown: z.record(
        invoiceCategorySchema,
        z.object({
            count: z.number().int(),
            amount: z.number(),
        }),
    ),
    monthlyTrend: z.array(
        z.object({
            month: z.string(),
            amount: z.number(),
            count: z.number().int(),
        }),
    ),
    topSuppliers: z.array(
        z.object({
            name: z.string(),
            amount: z.number(),
            count: z.number().int(),
        }),
    ),
});
export type InvoiceStats = z.infer<typeof invoiceStatsSchema>;
