import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { SortOrder } from "./commonSchemas";
import { InvoiceCategory, InvoiceStatus } from "./invoiceSchema";
import { Invoice, InvoiceFile, invoiceFiles, invoices } from "./invoiceTables";

export const selectInvoiceFileSchema = createSelectSchema(invoiceFiles);
export const insertInvoiceFileSchema = createInsertSchema(invoiceFiles);
//export type InvoiceFile from invoiceTables.ts
export const selectInvoiceSchema = createSelectSchema(invoices);
export const insertInvoiceSchema = createInsertSchema(invoices);
//export type Invoice from invoiceTables.ts

// Create Invoice Data
export type CreateInvoiceData = {
    userId: string;
    fileId: string;
    status?: InvoiceStatus;
};

export type UpdateInvoiceData = {
    invoiceNumber?: string;
    supplierName?: string;
    supplierAddress?: string;
    supplierTaxId?: string;
    subtotal?: number;
    taxAmount?: number;
    taxRate?: number;
    totalAmount?: number;
    currency?: string;
    invoiceDate?: Date;
    dueDate?: Date;
    category?: InvoiceCategory;
    customCategory?: string;
    notes?: string;
    tags?: string[];
};

export type InvoiceListFilters = {
    category?: InvoiceCategory;
    status?: InvoiceStatus;
    supplierName?: string;
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
    tags?: string[];
    description?: string;
};

export type InvoiceListSort = {
    field:
        | "invoiceDate"
        | "totalAmount"
        | "supplierName"
        | "createdAt"
        | "updatedAt";
    direction: SortOrder;
};

export type InvoiceStats = {
    totalAmount: number;
    totalCount: number;
    categoryBreakdown: Record<
        InvoiceCategory,
        { count: number; amount: number }
    >;
    monthlyTrend: { month: string; amount: number; count: number }[];
    topSuppliers: { name: string; amount: number; count: number }[];
};

// Category statistics schemas for analytics (DAL layer)
export type RawCategoryStats = {
    category: InvoiceCategory | null;
    count: number;
    totalAmount: string | null; // Drizzle returns sum/avg as strings
    averageAmount: string | null;
};

export type EnrichedCategoryStats = {
    name: string;
    description: string;
    color: string;
    keywords: readonly string[];
    count: number;
    totalAmount: number;
    averageAmount: number;
    percentage: number;
};

export type CategoryStatsData = {
    categories: EnrichedCategoryStats[];
    totalCategories: number;
    totalInvoices: number;
    totalAmount: number;
};

// DAL layer return types (pure data, no API response wrapper)
export type InvoiceWithFile = {
    invoice: Invoice;
    file: InvoiceFile | null;
};

export type InvoiceListResult = {
    invoices: InvoiceWithFile[];
    totalCount: number;
    hasMore: boolean;
};
