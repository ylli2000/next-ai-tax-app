import { createId } from "@paralleldrive/cuid2";
import {
    decimal,
    index,
    integer,
    json,
    pgEnum,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { AI_CONSTANTS, ValidationStatusEnum } from "./aiSchema";
import { FINANCIAL_CONSTANTS, PRECISION_CONSTANTS } from "./financialSchema";
import {
    INVOICE_CONSTANTS,
    InvoiceCategoryEnum,
    InvoiceStatusEnum,
} from "./invoiceSchema";
import { UPLOAD_CONSTANTS, UploadStatusEnum } from "./uploadSchema";
import { users } from "./userTables";

export const invoiceStatusEnum = pgEnum("invoice_status", InvoiceStatusEnum);
export const invoiceCategoryEnum = pgEnum(
    "invoice_category",
    InvoiceCategoryEnum,
);
export const validationStatusEnum = pgEnum(
    "validation_status",
    ValidationStatusEnum,
);
export const uploadStatusEnum = pgEnum("upload_status", UploadStatusEnum);

export const invoiceFiles = pgTable("invoice_files", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => createId()),
    originalName: text("original_name").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    openaiFileId: text("openai_file_id"),
    uploadStatus: uploadStatusEnum("upload_status")
        .notNull()
        .default(UPLOAD_CONSTANTS.DEFAULT_UPLOAD_STATUS),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type InvoiceFile = typeof invoiceFiles.$inferSelect;

export const invoices = pgTable(
    "invoices",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        fileId: text("file_id")
            .notNull()
            .references(() => invoiceFiles.id, { onDelete: "cascade" }),

        // Basic invoice information
        invoiceNumber: text("invoice_number"),
        supplierName: text("supplier_name"),
        supplierAddress: text("supplier_address"),
        supplierTaxId: text("supplier_tax_id"),

        // Financial information
        subtotal: decimal("subtotal", {
            precision: PRECISION_CONSTANTS.DECIMAL_PRECISION,
            scale: PRECISION_CONSTANTS.DECIMAL_SCALE,
        }),
        taxAmount: decimal("tax_amount", {
            precision: PRECISION_CONSTANTS.DECIMAL_PRECISION,
            scale: PRECISION_CONSTANTS.DECIMAL_SCALE,
        }),
        taxRate: decimal("tax_rate", {
            precision: PRECISION_CONSTANTS.TAX_RATE_PRECISION,
            scale: PRECISION_CONSTANTS.TAX_RATE_SCALE,
        }),
        totalAmount: decimal("total_amount", {
            precision: PRECISION_CONSTANTS.DECIMAL_PRECISION,
            scale: PRECISION_CONSTANTS.DECIMAL_SCALE,
        }),
        currency: text("currency").default(
            FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
        ),

        // Dates
        invoiceDate: timestamp("invoice_date"),
        dueDate: timestamp("due_date"),

        // Categorization
        category: invoiceCategoryEnum("category"),
        customCategory: text("custom_category"),

        // Description
        description: text("description"),

        // AI Processing
        extractedData: json("extracted_data"),
        aiConfidenceScore: decimal("ai_confidence_score", {
            precision: PRECISION_CONSTANTS.CONFIDENCE_PRECISION,
            scale: PRECISION_CONSTANTS.CONFIDENCE_SCALE,
        }),
        validationStatus: validationStatusEnum("validation_status")
            .notNull()
            .default(AI_CONSTANTS.DEFAULT_VALIDATION_STATUS),
        validationErrors: json("validation_errors"),

        // Status and metadata
        status: invoiceStatusEnum("status")
            .notNull()
            .default(INVOICE_CONSTANTS.DEFAULT_INVOICE_STATUS),
        notes: text("notes"),
        tags: json("tags"),

        // Audit trail
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
        processedAt: timestamp("processed_at"),
    },
    (table) => [
        // Composite indexes for better query performance
        index("invoices_user_date_idx").on(table.userId, table.invoiceDate),
        index("invoices_user_status_idx").on(table.userId, table.status),
    ],
);
export type Invoice = typeof invoices.$inferSelect;
