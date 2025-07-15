import { OpenAI } from "openai";
import {
    AI_CATEGORY_CONSTANTS,
    AI_VALIDATION_CONSTANTS,
    extractedInvoiceDataSchema,
    OPENAI_CONSTANTS,
    AI_PROMPTS,
    mapOpenAIError,
    type AIExtractionResponse,
    type ExtractedInvoiceData,
    type SmartCategoryResult,
    type ValidationError,
    type ValidationResult,
} from "@/schema/aiSchema";
import { INVOICE_CATEGORIES } from "@/schema/invoiceSchema";
import { Invoice } from "@/schema/invoiceTables";
import {
    AI_MESSAGES,
    ERROR_MESSAGES,
    AIValidationErrorCode,
} from "@/schema/messageSchema";
import { env } from "@/schema/envSchema";
import { UploadStatus } from "@/schema/uploadSchema";
import { logInfo, logError } from "./logUtils";

/**
 * AI data processing utilities
 * Handles OpenAI API requests, responses, data validation, and category suggestions
 */

// ===== Processing and Cleanup =====

/**
 * Process image with OpenAI Vision for invoice data extraction
 * Uses OpenAI Vision API to analyze invoice images directly from S3 URL
 */
export const processWithOpenAIVision = async (
    s3ImageUrl: string,
    onProgressUpdate?: (status: UploadStatus, progress: number) => void,
): Promise<ExtractedInvoiceData> => {
    try {
        onProgressUpdate?.("AI_PROCESSING", 10);

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY,
            organization: env.OPENAI_ORGANIZATION_ID,
        });

        onProgressUpdate?.("AI_PROCESSING", 30);

        // Create chat completion with vision for invoice analysis
        const response = await openai.chat.completions.create({
            model: OPENAI_CONSTANTS.VISION_MODEL,
            max_tokens: OPENAI_CONSTANTS.MAX_TOKENS,
            temperature: OPENAI_CONSTANTS.TEMPERATURE,
            messages: [
                {
                    role: "system",
                    content: AI_PROMPTS.SYSTEM_PROMPT,
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: AI_PROMPTS.USER_PROMPT,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: s3ImageUrl, // Direct S3 pre-signed download URL
                            },
                        },
                    ],
                },
            ],
        });

        onProgressUpdate?.("AI_PROCESSING", 70);

        // Parse OpenAI response
        const responseText = response.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error("No response from OpenAI");
        }

        onProgressUpdate?.("AI_PROCESSING", 85);

        // Extract JSON from response (handle potential markdown formatting)
        let jsonData;
        try {
            // Remove any markdown formatting or extra text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : responseText;
            jsonData = JSON.parse(jsonString);
        } catch (parseError) {
            logError("Failed to parse OpenAI JSON response", {
                responseText,
                parseError,
            });
            throw new Error(ERROR_MESSAGES.INVALID_AI_RESPONSE_FORMAT);
        }

        onProgressUpdate?.("AI_PROCESSING", 95);

        // Validate and transform the response using our schema
        const validatedData = extractedInvoiceDataSchema.parse(jsonData);

        logInfo("OpenAI Vision processing completed successfully", {
            s3ImageUrl: s3ImageUrl.split("?")[0], // Log URL without query params for privacy
            invoiceNumber: validatedData.invoiceNumber,
            supplierName: validatedData.supplierName,
            totalAmount: validatedData.totalAmount,
            suggestedCategory: validatedData.suggestedCategory,
            categoryConfidence: validatedData.categoryConfidence,
        });

        onProgressUpdate?.("AI_PROCESSING", 100);

        return validatedData;
    } catch (error) {
        logError("OpenAI Vision processing failed", {
            error,
            s3ImageUrl: s3ImageUrl.split("?")[0], // Log URL without query params for privacy
        });
        const { message } = mapOpenAIError(error);
        throw new Error(message, { cause: error });
    }
};

// ===== Response Processing =====

/**
 * Process OpenAI extraction response with enhanced category data
 */
export const processExtractionResponse = (
    response: unknown,
    confidence: number = AI_VALIDATION_CONSTANTS.DEFAULT_CONFIDENCE,
): AIExtractionResponse => {
    try {
        if (!response || typeof response !== "object") {
            return {
                success: false,
                error: ERROR_MESSAGES.INVALID_AI_RESPONSE_FORMAT,
            };
        }
        const data = response as Record<string, unknown>;
        // Use Zod to parse and validate the data according to OpenAI API contract
        const parseResult = extractedInvoiceDataSchema.safeParse({
            ...data,
            rawExtraction: data,
        });
        if (!parseResult.success) {
            return {
                success: false,
                error: `${ERROR_MESSAGES.INVALID_AI_RESPONSE_FORMAT}: ${parseResult.error.message}`,
            };
        }
        const extractedData = parseResult.data;
        return {
            success: true,
            data: extractedData,
            confidence,
            processingTime: AI_VALIDATION_CONSTANTS.PROCESSING_TIME_DEFAULT,
        };
    } catch (error) {
        return {
            success: false,
            error:
                ERROR_MESSAGES.FAILED_TO_PROCESS_AI_RESPONSE +
                (error instanceof Error
                    ? `: ${error.message}`
                    : ERROR_MESSAGES.UNKNOWN_ERROR),
        };
    }
};

// ===== Data Validation =====

/**
 * Validate extracted invoice data
 */
export const validateExtractionData = (
    data: ExtractedInvoiceData,
): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Missing total amount error
    if (!data.totalAmount) {
        errors.push({
            field: "totalAmount",
            code: "MISSING_TOTAL" as AIValidationErrorCode,
            message: ERROR_MESSAGES.MISSING_TOTAL,
            severity: AI_VALIDATION_CONSTANTS.ERROR_SEVERITY,
        });
    }

    // Missing supplier name warning
    if (!data.supplierName) {
        warnings.push({
            field: "supplierName",
            code: "MISSING_SUPPLIER" as AIValidationErrorCode,
            message: ERROR_MESSAGES.MISSING_SUPPLIER,
            severity: AI_VALIDATION_CONSTANTS.WARNING_SEVERITY,
        });
    }

    // Subtotal + tax amount != total amount warning
    if (data.subtotal && data.taxAmount && data.totalAmount) {
        const calculatedTotal = data.subtotal + data.taxAmount;
        const difference = Math.abs(calculatedTotal - data.totalAmount);
        if (difference > AI_VALIDATION_CONSTANTS.CALCULATION_TOLERANCE) {
            errors.push({
                field: "totalAmount",
                code: "CALCULATION_ERROR" as AIValidationErrorCode,
                message: ERROR_MESSAGES.CALCULATION_ERROR,
                severity: AI_VALIDATION_CONSTANTS.WARNING_SEVERITY,
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions: [],
    };
};

// ===== Category Suggestions =====

/**
 * Main category suggestion function with AI-first approach and historical fallback
 */
export const suggestCategory = (
    data: ExtractedInvoiceData,
    historicalInvoices: Invoice[] = [],
): SmartCategoryResult => {
    // First, try AI suggestion
    const aiSuggestion = suggestCategoryFromAI(data);
    if (aiSuggestion) {
        // If AI confidence is high, use AI suggestion directly
        if (
            aiSuggestion.confidence >=
            AI_CATEGORY_CONSTANTS.GOOD_SUGGESTION_THRESHOLD
        ) {
            return aiSuggestion;
        }
        // If AI confidence is low, check historical data
        const historicalSuggestion = suggestCategoryFromHistory(
            data,
            historicalInvoices,
        );
        if (
            historicalSuggestion &&
            historicalSuggestion.confidence > aiSuggestion.confidence
        ) {
            // Use historical suggestion and add AI as alternative
            return {
                ...historicalSuggestion,
                alternativeCategories: [
                    {
                        category: aiSuggestion.suggestedCategory,
                        confidence: aiSuggestion.confidence,
                    },
                ],
            };
        }
        // Use AI suggestion even with low confidence if no better historical data
        return aiSuggestion;
    }
    // If no AI suggestion, try historical data
    const historicalSuggestion = suggestCategoryFromHistory(
        data,
        historicalInvoices,
    );
    if (historicalSuggestion) return historicalSuggestion;
    // Fallback to default category
    return {
        suggestedCategory: AI_CATEGORY_CONSTANTS.DEFAULT_CATEGORY,
        confidence: AI_CATEGORY_CONSTANTS.DEFAULT_CONFIDENCE,
        reasoning: AI_MESSAGES.DEFAULT_REASONING.replace("{baseName}", "Other"),
        alternativeCategories: [],
    };
};

/**
 * Get AI category suggestion from extracted data
 */
export const suggestCategoryFromAI = (
    data: ExtractedInvoiceData,
): SmartCategoryResult | null => {
    if (
        data.suggestedCategory &&
        data.categoryConfidence !== undefined &&
        data.categoryReasoning
    ) {
        // Validate that the suggested category is valid (INVOICE_CATEGORIES is now an object with category keys)
        const validCategory =
            data.suggestedCategory &&
            INVOICE_CATEGORIES[
                data.suggestedCategory as keyof typeof INVOICE_CATEGORIES
            ];
        if (validCategory) {
            return {
                suggestedCategory: data.suggestedCategory,
                confidence: data.categoryConfidence,
                reasoning: data.categoryReasoning,
                alternativeCategories: [],
            };
        }
    }
    return null;
};

/**
 * Get category suggestion from historical invoices for the same supplier
 */
export const suggestCategoryFromHistory = (
    data: ExtractedInvoiceData,
    historicalInvoices: Invoice[],
): SmartCategoryResult | null => {
    const supplierName = data.supplierName?.toLowerCase() || "";
    if (!supplierName || historicalInvoices.length === 0) return null;
    const supplierInvoices = historicalInvoices.filter((inv) =>
        inv.supplierName?.toLowerCase().includes(supplierName),
    );
    if (supplierInvoices.length === 0) return null;
    // Calculate most common category for this supplier
    const categoryCount: Record<string, number> = {};
    supplierInvoices.forEach((inv) => {
        if (inv.category)
            categoryCount[inv.category] =
                (categoryCount[inv.category] || 0) + 1;
    });
    const mostCommon = Object.entries(categoryCount).sort(
        ([, a], [, b]) => b - a,
    )[0];
    // Need 2+ records to ensure reliable pattern (e.g., 1 "Office Depot" → TRAVEL = likely error, 3 → OFFICE_SUPPLIES = trusted)
    if (!mostCommon || mostCommon[1] < 2) return null;
    const historicalConfidence = Math.min(
        AI_CATEGORY_CONSTANTS.MAX_HISTORICAL_CONFIDENCE,
        AI_CATEGORY_CONSTANTS.HISTORICAL_CONFIDENCE_BASE +
            (mostCommon[1] / supplierInvoices.length) *
                AI_CATEGORY_CONSTANTS.HISTORICAL_CONFIDENCE_FACTOR,
    );
    return {
        suggestedCategory: mostCommon[0],
        confidence: historicalConfidence,
        reasoning: generateCategoryReasoning(mostCommon[0], supplierName),
        alternativeCategories: [],
    };
};

/**
 * Generate reasoning for category suggestion
 */
export const generateCategoryReasoning = (
    category: string,
    supplierName: string,
): string => {
    const categoryData =
        INVOICE_CATEGORIES[category as keyof typeof INVOICE_CATEGORIES];
    const baseName = categoryData?.name || category;
    return supplierName
        ? AI_MESSAGES.SUPPLIER_BASED_REASONING.replace(
              "{baseName}",
              baseName,
          ).replace("{supplierName}", supplierName)
        : AI_MESSAGES.DEFAULT_REASONING.replace("{baseName}", baseName);
};

// ===== Helper Functions =====

// Response helpers
export const isSuccessfulExtraction = (response: AIExtractionResponse) =>
    response.success && !!response.data;
export const hasHighConfidence = (response: AIExtractionResponse) =>
    (response.confidence || 0) >
    AI_CATEGORY_CONSTANTS.HIGH_CONFIDENCE_THRESHOLD;

// Validation helpers
export const hasErrors = (validation: ValidationResult) =>
    validation.errors.length > 0;
export const hasWarnings = (validation: ValidationResult) =>
    validation.warnings.length > 0;

// Category helpers
export const hasGoodCategorySuggestion = (result: SmartCategoryResult) =>
    result.confidence > AI_CATEGORY_CONSTANTS.GOOD_SUGGESTION_THRESHOLD;
export const getCategoryDisplayName = (categoryKey: string) =>
    INVOICE_CATEGORIES[categoryKey as keyof typeof INVOICE_CATEGORIES]?.name ||
    categoryKey;
