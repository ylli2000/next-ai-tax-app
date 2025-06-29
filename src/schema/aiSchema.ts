export type AIProvider = 'OPENAI';

export type AIExtractionRequest = {
    fileId: string;
    fileName: string;
    mimeType: string;
    openaiFileId?: string;
};

export type AIExtractionResponse = {
    success: boolean;
    data?: ExtractedInvoiceData;
    error?: string;
    confidence?: number;
    processingTime?: number;
};

export type ExtractedInvoiceData = {
    invoiceNumber?: string;
    supplierName?: string;
    supplierAddress?: string;
    supplierTaxId?: string;
    subtotal?: number;
    taxAmount?: number;
    taxRate?: number;
    totalAmount?: number;
    currency?: string;
    invoiceDate?: string;
    dueDate?: string;
    items?: InvoiceItem[];
    rawExtraction?: Record<string, unknown>;
};

export type InvoiceItem = {
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    taxRate?: number;
};

export type ValidationResult = {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
};

export type ValidationError = {
    field: string;
    code: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
};

export type ValidationWarning = {
    field: string;
    code: string;
    message: string;
    suggestedValue?: unknown;
};

export type ValidationSuggestion = {
    type: 'CATEGORY' | 'SUPPLIER_CORRECTION' | 'TAX_DEDUCTION' | 'PAYMENT_REMINDER';
    message: string;
    data?: Record<string, unknown>;
    confidence?: number;
};

export type AnomalyDetectionResult = {
    isDuplicate: boolean;
    isAmountAnomaly: boolean;
    isDateAnomaly: boolean;
    isSupplierAnomaly: boolean;
    details: AnomalyDetail[];
};

export type AnomalyDetail = {
    type: 'DUPLICATE_INVOICE' | 'AMOUNT_SPIKE' | 'FUTURE_DATE' | 'OLD_DATE' | 'NEW_SUPPLIER' | 'SUPPLIER_MISMATCH';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    data?: Record<string, unknown>;
    suggestedAction?: string;
};

export type SmartCategoryResult = {
    suggestedCategory: string;
    confidence: number;
    reasoning: string;
    alternativeCategories: Array<{
        category: string;
        confidence: number;
    }>;
};

export type AIUsageStats = {
    tokensUsed: number;
    requestCount: number;
    successRate: number;
    averageProcessingTime: number;
    lastUpdated: Date;
}; 