export type UploadStatus = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

export type FileUpload = {
    id: string;
    file: File;
    status: UploadStatus;
    progress: number;
    error?: string;
    result?: UploadResult;
};

export type UploadResult = {
    fileId: string;
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    openaiFileId?: string;
    extractedData?: ExtractedInvoiceData;
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
    confidence?: number;
};

export type InvoiceItem = {
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    taxRate?: number;
};

export type UploadConfig = {
    maxSize: number;
    allowedTypes: string[];
    multiple: boolean;
};

export type UploadError = {
    code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'PROCESSING_FAILED' | 'AI_EXTRACTION_FAILED';
    message: string;
    details?: Record<string, unknown>;
}; 