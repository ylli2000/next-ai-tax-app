import { z } from "zod";
import { InvoiceCategory } from "./invoiceSchema";
import { ERROR_MESSAGES } from "./messageSchema";
import { VALIDATION_RULES } from "./commonSchemas";
import { allowedMimeTypeSchema, validFileFormatSchema } from "./uploadSchema";

/**
 * Map OpenAI errors to consistent error codes and messages
 * Uses ternary operators for concise and readable code like mapHttpError
 */
export const mapOpenAIError = (
    error: unknown,
): {
    code: keyof typeof ERROR_MESSAGES;
    message: string;
} => {
    if (!(error instanceof Error))
        return {
            code: "AI_PROCESSING_FAILED",
            message: ERROR_MESSAGES.AI_PROCESSING_FAILED,
        };
    const e = error.message.toLowerCase();
    // prettier-ignore
    const code: keyof typeof ERROR_MESSAGES = 
        e.includes("rate_limit")     || e.includes("429")         ? "OPENAI_RATE_LIMIT" :
        e.includes("invalid_file")   || e.includes("unsupported") ? "OPENAI_INVALID_FILE" :
        e.includes("file_not_found") || e.includes("404")         ? "OPENAI_FILE_NOT_FOUND" :
        e.includes("timeout")                                     ? "OPENAI_PROCESSING_TIMEOUT" :
        e.includes("no response")                                 ? "OPENAI_API_ERROR" : "AI_PROCESSING_FAILED";
    const message = ERROR_MESSAGES[code];
    return { code, message };
};

/**
 * AI-related schemas using Zod for runtime validation and type inference
 * Handles AI processing, validation, and anomaly detection
 */

// AI Provider enum
export const AIProviderEnum = ["OPENAI"] as const;
export const aiProviderSchema = z.enum(AIProviderEnum);
export type AIProvider = z.infer<typeof aiProviderSchema>;

// OpenAI constants
export const OPENAI_CONSTANTS = {
    MAX_TOKENS: 4000, // Used in OpenAI API calls for response length limiting
    TEMPERATURE: 0.1, // Used in OpenAI API calls for response consistency (low creativity)
    MODEL: "gpt-4o", // Used in OpenAI text processing API calls
    VISION_MODEL: "gpt-4o", // Used in OpenAI image/invoice processing API calls
    MAX_RETRY_ATTEMPTS: 3, // Used in aiUtils.ts for failed API call retries
    RETRY_DELAY_MS: 1000, // Used in aiUtils.ts for retry delay timing
} as const;

// AI Validation Constants
export const AI_VALIDATION_CONSTANTS = {
    // Validation severity levels
    ERROR_SEVERITY: "ERROR" as ValidationSeverity,
    WARNING_SEVERITY: "WARNING" as ValidationSeverity,
    // Default values
    DEFAULT_CONFIDENCE: 0.8,
    CALCULATION_TOLERANCE: 0.01,
    PROCESSING_TIME_DEFAULT: 0,
} as const;

// Anomaly detection type enum
export const AnomalyTypeEnum = [
    "DUPLICATE_INVOICE",
    "AMOUNT_SPIKE",
    "FUTURE_DATE",
    "OLD_DATE",
    "NEW_SUPPLIER",
    "SUPPLIER_MISMATCH",
] as const;
export const anomalyTypeSchema = z.enum(AnomalyTypeEnum);
export type AnomalyType = z.infer<typeof anomalyTypeSchema>;

// Anomaly severity enum
export const AnomalySeverityEnum = ["LOW", "MEDIUM", "HIGH"] as const;
export const anomalySeveritySchema = z.enum(AnomalySeverityEnum);
export type AnomalySeverity = z.infer<typeof anomalySeveritySchema>;

// Validation severity enum
export const ValidationSeverityEnum = ["OK", "ERROR", "WARNING"] as const;
export const validationSeveritySchema = z.enum(ValidationSeverityEnum);
export type ValidationSeverity = z.infer<typeof validationSeveritySchema>;

// Validation suggestion type enum
export const ValidationSuggestionTypeEnum = [
    "CATEGORY",
    "SUPPLIER_CORRECTION",
    "TAX_DEDUCTION",
    "PAYMENT_REMINDER",
] as const;
export const validationSuggestionTypeSchema = z.enum(
    ValidationSuggestionTypeEnum,
);
export type ValidationSuggestionType = z.infer<
    typeof validationSuggestionTypeSchema
>;

// AI Prompts Constants
export const AI_PROMPTS = {
    // System Prompt
    SYSTEM_PROMPT: `
You are an expert invoice data extraction and categorization AI for Australian businesses. Extract structured data from invoice images and suggest appropriate tax deductible categories.\n
Return data in JSON format with the following fields: invoiceNumber, supplierName, supplierAddress, supplierTaxId, description, subtotal, taxAmount, taxRate, totalAmount, currency, invoiceDate, dueDate, items, suggestedCategory, categoryConfidence, categoryReasoning.\n
The description should be a brief summary of what is being purchased (e.g., "two tables and a few pencils", "subscription to openAI", "accountant services").\n
For category suggestion, choose from these Australian tax deductible categories:\n  
- OFFICE_SUPPLIES: Office equipment, stationery, supplies\n  
- TRAVEL_TRANSPORT: Business travel, flights, hotels, taxis, transport\n  
- MEALS_ENTERTAINMENT: Business meals, entertainment (limited deductibility)\n  
- SOFTWARE_TECH: Software licenses, technology equipment, SaaS subscriptions\n  
- RENT_UTILITIES: Office rent, lease, workspace\n  
- UTILITIES: Electricity, gas, water, power bills\n  
- COMMUNICATIONS: Phone, internet, mobile, broadband services\n  
- REPAIRS_MAINTENANCE: Equipment repairs, maintenance, services\n  
- TRAINING_EDUCATION: Professional development, courses, certifications\n  
- FINANCIAL_SERVICES: Banking fees, insurance, financial services\n  
- MARKETING_ADVERTISING: Marketing, advertising, promotional expenses\n  
- LEGAL_CONSULTING: Legal services, consulting, professional advice\n  
- OTHER: Miscellaneous business expenses\n
Use null for missing values.\n
Ensure all monetary values are numbers without currency symbols.\n
Category confidence should be 0.0-1.0.\n
Format dates on invoice to Australian date DD/MM/YYYY (e.g., 15/03/2024 for March 15, 2024).`,
    // User Prompt
    USER_PROMPT: `
Extract all relevant data from this invoice image and suggest the most appropriate Australian tax deductible category. Pay special attention to:\n
1. Invoice number and date\n
2. Supplier information (name, address, tax ID)\n
3. A brief description of what this invoice is for\n
4. Tax calculations and total amounts\n
5. Individual line items with descriptions\n
6. Payment due date\n
7. Category suggestion based on supplier, items, and purpose of expense\n
8. Provide reasoning for category choice considering Australian tax deductibility rules\n
Return only valid JSON without any additional text.`,
} as const;

// AI Category Suggestion Constants
export const AI_CATEGORY_CONSTANTS = {
    // Default values
    DEFAULT_CATEGORY: "OTHER" as InvoiceCategory,
    DEFAULT_CONFIDENCE: 0.3,
    HIGH_CONFIDENCE_THRESHOLD: 0.8,
    GOOD_SUGGESTION_THRESHOLD: 0.6,
    HISTORICAL_CONFIDENCE_BASE: 0.6,
    HISTORICAL_CONFIDENCE_FACTOR: 0.3,
    MAX_HISTORICAL_CONFIDENCE: 0.9,
} as const;

// Validation Error Schema
export const validationErrorSchema = z.object({
    field: z.string(),
    code: z.string(),
    message: z.string(),
    severity: validationSeveritySchema,
});
export type ValidationError = z.infer<typeof validationErrorSchema>;

// Validation Warning Schema
export const validationWarningSchema = z.object({
    field: z.string(),
    code: z.string(),
    message: z.string(),
    suggestedValue: z.unknown().optional(),
});
export type ValidationWarning = z.infer<typeof validationWarningSchema>;

// Validation Suggestion Schema
export const validationSuggestionSchema = z.object({
    type: validationSuggestionTypeSchema,
    message: z.string(),
    data: z.record(z.unknown()).optional(),
    confidence: z.number().min(0).max(1).optional(),
});
export type ValidationSuggestion = z.infer<typeof validationSuggestionSchema>;

// Validation Result Schema
export const validationResultSchema = z.object({
    isValid: z.boolean(),
    errors: z.array(validationErrorSchema),
    warnings: z.array(validationWarningSchema),
    suggestions: z.array(validationSuggestionSchema),
});
export type ValidationResult = z.infer<typeof validationResultSchema>;

// AI extracted invoice Item Schema - OpenAI should return correct types per API contract
export const extractedInvoiceItemSchema = z.object({
    description: z.string().optional(),
    quantity: z.number().optional(),
    unitPrice: z.number().optional(),
    totalPrice: z.number().optional(),
    taxRate: z.number().optional(),
});
export type ExtractedInvoiceItem = z.infer<typeof extractedInvoiceItemSchema>;

// AI extracted invoice data Schema - Based on OpenAI API contract (JSON with correct types)
export const extractedInvoiceDataSchema = z.object({
    invoiceNumber: z.string().optional(),
    supplierName: z.string().optional(),
    supplierAddress: z.string().optional(),
    supplierTaxId: z.string().optional(),
    subtotal: z.number().optional(), // OpenAI should return number per prompt requirement
    taxAmount: z.number().optional(), // OpenAI should return number per prompt requirement
    taxRate: z.number().optional(), // OpenAI should return number per prompt requirement
    totalAmount: z.number().optional(), // OpenAI should return number per prompt requirement
    currency: z.string().optional(),
    invoiceDate: z.string().optional(), // Date as ISO string
    dueDate: z.string().optional(), // Date as ISO string
    description: z.string().optional(),
    items: z.array(extractedInvoiceItemSchema).optional(),
    suggestedCategory: z.string().optional(), // AI-suggested category from single extraction call
    categoryConfidence: z.number().min(0).max(1).optional(), // OpenAI should return 0.0-1.0 per prompt requirement
    categoryReasoning: z.string().optional(), // AI reasoning for category choice
    rawExtraction: z.record(z.unknown()).optional(), // For AI processing raw data
});
export type ExtractedInvoiceData = z.infer<typeof extractedInvoiceDataSchema>;
// AI Extraction Request Schema
export const aiExtractionRequestSchema = z.object({
    fileId: z.string().uuid(),
    fileName: validFileFormatSchema,
    mimeType: allowedMimeTypeSchema,
    openaiFileId: z
        .string()
        .regex(
            VALIDATION_RULES.OPENAI_FIELD_ID_REGEX,
            ERROR_MESSAGES.INVALID_OPENAI_FIELD_ID,
        )
        .optional(),
});
export type AIExtractionRequest = z.infer<typeof aiExtractionRequestSchema>;

// AI Extraction Response Schema
export const aiExtractionResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    processingTime: z.number().min(0).optional(),
});
export type AIExtractionResponse = z.infer<typeof aiExtractionResponseSchema>;

// Anomaly Detail Schema
export const anomalyDetailSchema = z.object({
    type: anomalyTypeSchema,
    severity: anomalySeveritySchema,
    message: z.string(),
    data: z.record(z.unknown()).optional(),
    suggestedAction: z.string().optional(),
});
export type AnomalyDetail = z.infer<typeof anomalyDetailSchema>;

// Anomaly Detection Result Schema
export const anomalyDetectionResultSchema = z.object({
    isDuplicate: z.boolean(),
    isAmountAnomaly: z.boolean(),
    isDateAnomaly: z.boolean(),
    isSupplierAnomaly: z.boolean(),
    details: z.array(anomalyDetailSchema),
});
export type AnomalyDetectionResult = z.infer<
    typeof anomalyDetectionResultSchema
>;

// Alternative Category Schema
export const alternativeCategorySchema = z.object({
    category: z.string(),
    confidence: z.number().min(0).max(1),
});
export type AlternativeCategory = z.infer<typeof alternativeCategorySchema>;

// Smart Category Result Schema
export const smartCategoryResultSchema = z.object({
    suggestedCategory: z.string(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    alternativeCategories: z.array(alternativeCategorySchema),
});
export type SmartCategoryResult = z.infer<typeof smartCategoryResultSchema>;

// AI Usage Stats Schema
export const aiUsageStatsSchema = z.object({
    tokensUsed: z.number().min(0),
    requestCount: z.number().min(0),
    successRate: z.number().min(0).max(1),
    averageProcessingTime: z.number().min(0),
    lastUpdated: z.date(),
});
export type AIUsageStats = z.infer<typeof aiUsageStatsSchema>;
