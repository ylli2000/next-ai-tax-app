export type InvoiceStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';

export type InvoiceCategory = 
    | 'OFFICE_SUPPLIES'
    | 'TRAVEL_TRANSPORT'
    | 'MEALS_ENTERTAINMENT'
    | 'SOFTWARE_TECH'
    | 'RENT_UTILITIES'
    | 'UTILITIES'
    | 'COMMUNICATIONS'
    | 'REPAIRS_MAINTENANCE'
    | 'TRAINING_EDUCATION'
    | 'FINANCIAL_SERVICES'
    | 'MARKETING_ADVERTISING'
    | 'LEGAL_CONSULTING'
    | 'OTHER';

export type Invoice = {
    id: string;
    userId: string;
    fileId: string;
    
    // Basic invoice information
    invoiceNumber: string | null;
    supplierName: string | null;
    supplierAddress: string | null;
    supplierTaxId: string | null;
    
    // Financial information
    subtotal: number | null;
    taxAmount: number | null;
    taxRate: number | null;
    totalAmount: number | null;
    currency: string | null;
    
    // Dates
    invoiceDate: Date | null;
    dueDate: Date | null;
    
    // Categorization
    category: InvoiceCategory | null;
    customCategory: string | null;
    
    // AI Processing
    extractedData: Record<string, unknown> | null;
    aiConfidenceScore: number | null;
    validationStatus: 'PENDING' | 'VALID' | 'INVALID' | 'NEEDS_REVIEW';
    validationErrors: string[] | null;
    
    // Status and metadata
    status: InvoiceStatus;
    notes: string | null;
    tags: string[] | null;
    
    // Audit trail
    createdAt: Date;
    updatedAt: Date;
    processedAt: Date | null;
};

export type InvoiceFile = {
    id: string;
    invoiceId: string;
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    openaiFileId: string | null;
    uploadStatus: 'UPLOADING' | 'UPLOADED' | 'FAILED';
    createdAt: Date;
};

export type CreateInvoiceData = {
    userId: string;
    fileId: string;
    status?: InvoiceStatus;
};

export type UpdateInvoiceData = Partial<Pick<Invoice, 
    | 'invoiceNumber'
    | 'supplierName'
    | 'supplierAddress'
    | 'supplierTaxId'
    | 'subtotal'
    | 'taxAmount'
    | 'taxRate'
    | 'totalAmount'
    | 'currency'
    | 'invoiceDate'
    | 'dueDate'
    | 'category'
    | 'customCategory'
    | 'notes'
    | 'tags'
    | 'status'
>>;

export type InvoiceListFilters = {
    category?: InvoiceCategory;
    status?: InvoiceStatus;
    supplierName?: string;
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
    tags?: string[];
};

export type InvoiceListSort = {
    field: 'invoiceDate' | 'totalAmount' | 'supplierName' | 'createdAt' | 'updatedAt';
    direction: 'asc' | 'desc';
};

export type InvoiceStats = {
    totalAmount: number;
    totalCount: number;
    categoryBreakdown: Record<InvoiceCategory, { count: number; amount: number }>;
    monthlyTrend: Array<{ month: string; amount: number; count: number }>;
    topSuppliers: Array<{ name: string; amount: number; count: number }>;
}; 