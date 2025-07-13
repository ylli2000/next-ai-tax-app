import { z } from "zod";
import { VALIDATION_RULES } from "./commonSchemas";
import { validateDateFormatSchema } from "./dateSchema";
import { ERROR_MESSAGES } from "./messageSchema";
import { SupportedCurrencyEnum } from "./financialSchema";

/*
Invoice Status - Tracks the overall processing lifecycle of invoices
  - Location: invoiceStatusSchema in invoiceSchema.ts  
  - Values: PENDING → PROCESSING → COMPLETED → FAILED → ARCHIVED
  - Purpose: Track the entire invoice lifecycle and processing progress

  Summary:
  - status = "What stage is this invoice processing at?"
*/
export const InvoiceStatusEnum = [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "ARCHIVED",
] as const;
export const invoiceStatusSchema = z.enum(InvoiceStatusEnum);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
/*
Validation Status - Tracks quality and correctness of AI-extracted data
  - Location: validationStatusSchema in aiSchema.ts
  - Values: PENDING → VALID → INVALID → NEEDS_REVIEW
  - Purpose: Track the quality status of AI validation results

  Workflow relationship:
  File upload → Invoice Status: PENDING
             ↓
  AI starts extraction → Invoice Status: PROCESSING
                      ↓
  AI extraction complete → Invoice Status: COMPLETED
                        ↓
  AI validates data → Validation Status: PENDING
                   ↓
  Validation result → Validation Status: VALID/INVALID/NEEDS_REVIEW

  Summary:
  - validationStatus = "How good is the AI-extracted data quality?"
*/
// Validation Status - Tracks the quality and correctness of AI-extracted data
export const ValidationStatusEnum = [
    "PENDING", // AI validation has not started yet
    "VALID", // AI extracted data passed all validation checks
    "INVALID", // AI extracted data failed validation checks
    "NEEDS_REVIEW", // AI extracted data requires manual review due to uncertainties
] as const;
export const validationStatusSchema = z.enum(ValidationStatusEnum);
export type ValidationStatus = z.infer<typeof validationStatusSchema>;

// Formatting constants for formatUtils.ts
export const INVOICE_CONSTANTS = {
    DEFAULT_VALIDATION_STATUS: "PENDING" as ValidationStatus, // Used in AI validation workflow
    DEFAULT_INVOICE_STATUS: "PENDING" as InvoiceStatus, // Used in invoice creation and status initialization
    TRUNCATE_SUFFIX: "...", // Used in formatUtils.ts for text truncation suffix
    INVOICE_PREFIX: "INV-", // Used in formatUtils.ts for invoice number formatting
    INVOICE_NUMBER_PADDING: 6, // Used in formatUtils.ts for invoice number padding length
    CREDIT_CARD_GROUP_SIZE: 4, // Used in formatUtils.ts for credit card number grouping
    DEFAULT_ITEMS_PER_PAGE: 20, // Used in formatUtils.ts for default items per page
    DEFAULT_TRUNCATE_LENGTH: 50, // Used in formatUtils.ts for default text truncation length
} as const;

// Default Categories for Seeding (optimized with JSON keywords)
export const INVOICE_CATEGORIES = {
    OFFICE_SUPPLIES: {
        name: "Office Supplies",
        description: "Office equipment and supplies",
        color: "#3B82F6",
        keywords: ["office", "supplies", "equipment", "stationery"],
    },
    TRAVEL_TRANSPORT: {
        name: "Travel & Transport",
        description: "Business travel expenses",
        color: "#10B981",
        keywords: ["travel", "transport", "hotel", "flight", "taxi", "uber"],
    },
    MEALS_ENTERTAINMENT: {
        name: "Meals & Entertainment",
        description:
            "Business meals and entertainment (limited deductibility in Australia)",
        color: "#F59E0B",
        keywords: ["meal", "restaurant", "entertainment", "dining", "catering"],
    },
    SOFTWARE_TECH: {
        name: "Software & Technology",
        description: "Software licenses and tech equipment",
        color: "#8B5CF6",
        keywords: [
            "software",
            "tech",
            "technology",
            "license",
            "saas",
            "subscription",
        ],
    },
    RENT_UTILITIES: {
        name: "Rent & Utilities",
        description: "Office rent and utilities",
        color: "#EF4444",
        keywords: ["rent", "lease", "office", "workspace"],
    },
    UTILITIES: {
        name: "Utilities",
        description: "Water, electricity, gas bills",
        color: "#F97316",
        keywords: [
            "electric",
            "electricity",
            "gas",
            "water",
            "utility",
            "power",
        ],
    },
    COMMUNICATIONS: {
        name: "Communications",
        description: "Phone and internet services",
        color: "#06B6D4",
        keywords: [
            "phone",
            "internet",
            "communication",
            "mobile",
            "broadband",
            "wifi",
        ],
    },
    REPAIRS_MAINTENANCE: {
        name: "Repairs & Maintenance",
        description: "Equipment repairs and maintenance",
        color: "#84CC16",
        keywords: ["repair", "maintenance", "service", "fix", "upgrade"],
    },
    TRAINING_EDUCATION: {
        name: "Training & Education",
        description: "Professional development and training",
        color: "#F97316",
        keywords: [
            "training",
            "education",
            "course",
            "certification",
            "learning",
            "development",
        ],
    },
    FINANCIAL_SERVICES: {
        name: "Financial Services",
        description: "Banking and financial fees",
        color: "#EC4899",
        keywords: [
            "bank",
            "banking",
            "financial",
            "fee",
            "interest",
            "loan",
            "insurance",
        ],
    },
    MARKETING_ADVERTISING: {
        name: "Marketing & Advertising",
        description: "Marketing and promotional expenses",
        color: "#6366F1",
        keywords: [
            "marketing",
            "advertising",
            "promotion",
            "ads",
            "campaign",
            "social",
        ],
    },
    LEGAL_CONSULTING: {
        name: "Legal & Consulting",
        description: "Legal and consulting services",
        color: "#14B8A6",
        keywords: [
            "legal",
            "lawyer",
            "consulting",
            "consultant",
            "advice",
            "professional",
        ],
    },
    OTHER: {
        name: "Other",
        description: "Miscellaneous business expenses",
        color: "#6B7280",
        keywords: ["other", "miscellaneous", "general"],
    },
} as const;

export const InvoiceCategoryEnum = Object.keys(INVOICE_CATEGORIES) as [
    keyof typeof INVOICE_CATEGORIES,
];
export const invoiceCategorySchema = z.enum(InvoiceCategoryEnum);
export type InvoiceCategory = z.infer<typeof invoiceCategorySchema>;

// Manual invoice creation schema (without file requirement)
export const manualInvoiceSchema = z.object({
    invoiceNumber: z
        .string()
        .min(
            VALIDATION_RULES.INVOICE_NUMBER_MIN_LENGTH,
            ERROR_MESSAGES.INVALID_INVOICE_NUMBER,
        )
        .max(
            VALIDATION_RULES.INVOICE_NUMBER_MAX_LENGTH,
            ERROR_MESSAGES.INVALID_INVOICE_NUMBER,
        )
        .regex(
            VALIDATION_RULES.INVOICE_REGEX,
            ERROR_MESSAGES.INVALID_INVOICE_NUMBER,
        )
        .optional(),
    supplierName: z
        .string()
        .min(
            VALIDATION_RULES.MIN_LINE_ITEM_LENGTH,
            ERROR_MESSAGES.INVALID_LINE_ITEM,
        )
        .max(
            VALIDATION_RULES.MAX_LINE_ITEM_LENGTH,
            ERROR_MESSAGES.INVALID_LINE_ITEM,
        )
        .optional(),
    supplierTaxId: z
        .string()
        .regex(VALIDATION_RULES.TAX_ID_REGEX, ERROR_MESSAGES.INVALID_TAX_ID)
        .optional(),
    supplierAddress: z
        .string()
        .min(
            VALIDATION_RULES.MIN_LINE_ITEM_LENGTH,
            ERROR_MESSAGES.INVALID_LINE_ITEM,
        )
        .max(
            VALIDATION_RULES.MAX_LINE_ITEM_LENGTH,
            ERROR_MESSAGES.INVALID_LINE_ITEM,
        )
        .optional(),
    subtotal: z
        .number()
        .min(VALIDATION_RULES.MIN_AMOUNT, ERROR_MESSAGES.INVALID_AMOUNT)
        .max(VALIDATION_RULES.MAX_AMOUNT, ERROR_MESSAGES.INVALID_AMOUNT)
        .optional(),
    taxAmount: z
        .number()
        .min(0, ERROR_MESSAGES.INVALID_AMOUNT)
        .max(VALIDATION_RULES.MAX_AMOUNT, ERROR_MESSAGES.INVALID_AMOUNT)
        .optional(),
    taxRate: z
        .number()
        .min(0, ERROR_MESSAGES.INVALID_TAX_RATE)
        .max(100, ERROR_MESSAGES.INVALID_TAX_RATE)
        .optional(),
    totalAmount: z
        .number()
        .min(VALIDATION_RULES.MIN_AMOUNT, ERROR_MESSAGES.INVALID_AMOUNT)
        .max(VALIDATION_RULES.MAX_AMOUNT, ERROR_MESSAGES.INVALID_AMOUNT)
        .optional(),
    currency: z
        .enum(SupportedCurrencyEnum, {
            message: ERROR_MESSAGES.INVALID_CURRENCY,
        })
        .optional(),
    invoiceDate: validateDateFormatSchema.optional(),
    dueDate: validateDateFormatSchema.optional(),
    category: z
        .enum(InvoiceCategoryEnum, {
            message: ERROR_MESSAGES.INVALID_CATEGORY,
        })
        .optional(),
    customCategory: z.string().optional(),
    description: z
        .string()
        .max(
            VALIDATION_RULES.MAX_DESCRIPTION_LENGTH,
            ERROR_MESSAGES.INVALID_DESCRIPTION,
        )
        .optional(),
    notes: z.string().optional(),
});

// Schema for updating existing invoice with AI extracted data
export const invoiceUpdateSchema = manualInvoiceSchema.extend({
    fileId: z.string().optional(),
    extractedData: z.record(z.unknown()).optional(),
    aiConfidenceScore: z.number().min(0).max(1).optional(),
    validationStatus: z.enum(ValidationStatusEnum).optional(),
    validationErrors: z.record(z.unknown()).optional(),
    processedAt: z.date().optional(),
    tags: z.array(z.string()).optional(),
});

// Type definitions
export type ManualInvoiceInput = z.infer<typeof manualInvoiceSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
