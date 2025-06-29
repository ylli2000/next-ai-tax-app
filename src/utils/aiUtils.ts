import {
    type AIExtractionResponse,
    type ExtractedInvoiceData,
    type SmartCategoryResult,
    type ValidationError,
    type ValidationResult
} from '@/types/aiSchema';
import { type Invoice } from '@/types/invoiceSchema';
import { INVOICE_CATEGORIES, OPENAI_CONSTANTS } from './constants';

/**
 * AI utility functions for invoice processing
 * Handles OpenAI API responses, data validation, and category suggestions
 */
export class AIUtils {
    // Process OpenAI extraction response
    static processExtractionResponse(
        response: unknown,
        confidence: number = 0.8
    ): AIExtractionResponse {
        try {
            if (!response || typeof response !== 'object') {
                return {
                    success: false,
                    error: 'Invalid response format from AI service',
                };
            }

            const data = response as Record<string, unknown>;
            
            const extractedData: ExtractedInvoiceData = {
                invoiceNumber: this.extractString(data.invoiceNumber),
                supplierName: this.extractString(data.supplierName),
                supplierAddress: this.extractString(data.supplierAddress),
                supplierTaxId: this.extractString(data.supplierTaxId),
                subtotal: this.extractNumber(data.subtotal),
                taxAmount: this.extractNumber(data.taxAmount),
                taxRate: this.extractNumber(data.taxRate),
                totalAmount: this.extractNumber(data.totalAmount),
                currency: this.extractString(data.currency) || 'USD',
                invoiceDate: this.extractDateString(data.invoiceDate),
                dueDate: this.extractDateString(data.dueDate),
                rawExtraction: data,
            };

            return {
                success: true,
                data: extractedData,
                confidence,
                processingTime: 0,
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to process AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    // Extract and validate string values
    static extractString(value: unknown): string | undefined {
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
        return undefined;
    }

    // Extract and validate number values
    static extractNumber(value: unknown): number | undefined {
        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
            return Number(value.toFixed(2));
        }
        if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(parsed) && parsed >= 0) {
                return Number(parsed.toFixed(2));
            }
        }
        return undefined;
    }

    // Extract and validate date strings
    static extractDateString(value: unknown): string | undefined {
        if (typeof value === 'string' && value.trim()) {
            const dateStr = value.trim();
            // Basic date validation
            if (!isNaN(Date.parse(dateStr))) {
                return dateStr;
            }
        }
        return undefined;
    }

    // Validate extracted invoice data
    static validateExtractionData(data: ExtractedInvoiceData): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Required field validation
        if (!data.totalAmount) {
            errors.push({
                field: 'totalAmount',
                code: 'MISSING_TOTAL',
                message: 'Total amount is required',
                severity: 'ERROR',
            });
        }

        if (!data.supplierName) {
            warnings.push({
                field: 'supplierName',
                code: 'MISSING_SUPPLIER',
                message: 'Supplier name is missing',
                severity: 'WARNING',
            });
        }

        // Mathematical validation
        if (data.subtotal && data.taxAmount && data.totalAmount) {
            const calculatedTotal = data.subtotal + data.taxAmount;
            const difference = Math.abs(calculatedTotal - data.totalAmount);
            
            if (difference > 0.01) {
                errors.push({
                    field: 'totalAmount',
                    code: 'CALCULATION_ERROR',
                    message: `Total amount doesn't match subtotal + tax`,
                    severity: 'ERROR',
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions: [],
        };
    }

    // Suggest invoice categories using simple rules
    static suggestCategory(
        data: ExtractedInvoiceData,
        historicalInvoices: Invoice[] = []
    ): SmartCategoryResult {
        const supplierName = data.supplierName?.toLowerCase() || '';
        
        // Simple rule-based category suggestion
        let suggestedCategory = 'OTHER';
        let confidence = 0.3;

        // Basic keyword matching
        if (supplierName.includes('office') || supplierName.includes('supplies')) {
            suggestedCategory = 'OFFICE_SUPPLIES';
            confidence = 0.8;
        } else if (supplierName.includes('software') || supplierName.includes('tech')) {
            suggestedCategory = 'SOFTWARE_TECH';
            confidence = 0.8;
        } else if (supplierName.includes('hotel') || supplierName.includes('travel')) {
            suggestedCategory = 'TRAVEL_TRANSPORT';
            confidence = 0.8;
        } else if (supplierName.includes('electric') || supplierName.includes('gas')) {
            suggestedCategory = 'UTILITIES';
            confidence = 0.8;
        }

        // Check historical data for this supplier
        if (supplierName && historicalInvoices.length > 0) {
            const supplierInvoices = historicalInvoices.filter(
                inv => inv.supplierName?.toLowerCase().includes(supplierName)
            );
            
            if (supplierInvoices.length > 0) {
                // Use most common category for this supplier
                const categoryCount: Record<string, number> = {};
                supplierInvoices.forEach(inv => {
                    if (inv.category) {
                        categoryCount[inv.category] = (categoryCount[inv.category] || 0) + 1;
                    }
                });
                
                const mostCommon = Object.entries(categoryCount)
                    .sort(([,a], [,b]) => b - a)[0];
                    
                if (mostCommon) {
                    suggestedCategory = mostCommon[0];
                    confidence = Math.min(0.9, 0.6 + (mostCommon[1] / supplierInvoices.length) * 0.3);
                }
            }
        }

        return {
            suggestedCategory,
            confidence,
            reasoning: this.generateCategoryReasoning(suggestedCategory, supplierName),
            alternativeCategories: [],
        };
    }

    // Generate reasoning for category suggestion
    static generateCategoryReasoning(category: string, supplierName: string): string {
        const categoryInfo = INVOICE_CATEGORIES[category as keyof typeof INVOICE_CATEGORIES];
        const baseName = categoryInfo?.label || category;

        if (supplierName) {
            return `Suggested "${baseName}" based on supplier name "${supplierName}".`;
        }

        return `Suggested "${baseName}" as default category.`;
    }

    // Format extracted data for storage
    static formatForStorage(data: ExtractedInvoiceData): Partial<Invoice> {
        return {
            invoiceNumber: data.invoiceNumber,
            supplierName: data.supplierName,
            supplierAddress: data.supplierAddress,
            supplierTaxId: data.supplierTaxId,
            subtotal: data.subtotal,
            taxAmount: data.taxAmount,
            taxRate: data.taxRate,
            totalAmount: data.totalAmount,
            currency: data.currency,
            invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            status: 'COMPLETED',
        };
    }

    // Create OpenAI prompt for extraction
    static createExtractionPrompt(): { system: string; user: string } {
        return {
            system: `You are an expert invoice data extraction AI. Extract structured data from invoice images with high accuracy.
Return data in JSON format with the following fields: invoiceNumber, supplierName, supplierAddress, supplierTaxId, 
subtotal, taxAmount, taxRate, totalAmount, currency, invoiceDate, dueDate.
Use null for missing values. Ensure all monetary values are numbers without currency symbols.`,
            
            user: `Extract all relevant data from this invoice image. Pay special attention to:
1. Invoice number and date
2. Supplier information (name, address, tax ID)
3. Tax calculations and total amounts
4. Payment due date
Return only valid JSON without any additional text.`,
        };
    }

    // Validate OpenAI configuration
    static validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!OPENAI_CONSTANTS.MODEL) {
            errors.push('OpenAI model is not configured');
        }

        if (!OPENAI_CONSTANTS.MAX_TOKENS || OPENAI_CONSTANTS.MAX_TOKENS <= 0) {
            errors.push('Invalid max tokens configuration');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

// Helper functions for AI operations
export const aiHelpers = {
    // Response helpers
    isSuccessfulExtraction: (response: AIExtractionResponse) => response.success && !!response.data,
    hasHighConfidence: (response: AIExtractionResponse) => (response.confidence || 0) > 0.8,
    
    // Validation helpers
    hasErrors: (validation: ValidationResult) => validation.errors.length > 0,
    hasWarnings: (validation: ValidationResult) => validation.warnings.length > 0,
    
    // Category helpers
    hasGoodCategorySuggestion: (result: SmartCategoryResult) => result.confidence > 0.6,
    getCategoryDisplayName: (categoryKey: string) => 
        INVOICE_CATEGORIES[categoryKey as keyof typeof INVOICE_CATEGORIES]?.label || categoryKey,
};

export default AIUtils; 