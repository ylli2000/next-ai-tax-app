export type ExportFormat = 'EXCEL' | 'CSV';

export type ExportOptions = {
    format: ExportFormat;
    includeHeaders: boolean;
    dateFormat: 'ISO' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    currency: string;
    filename?: string;
    fields: ExportField[];
    filters?: ExportFilters;
};

export type ExportField = {
    key: string;
    label: string;
    type: 'TEXT' | 'NUMBER' | 'DATE' | 'CURRENCY' | 'BOOLEAN';
    format?: string;
    included: boolean;
};

export type ExportFilters = {
    dateRange?: {
        from: Date;
        to: Date;
    };
    categories?: string[];
    suppliers?: string[];
    amountRange?: {
        min: number;
        max: number;
    };
    status?: string[];
    tags?: string[];
};

export type ExportJob = {
    id: string;
    userId: string;
    format: ExportFormat;
    status: ExportJobStatus;
    fileName: string;
    fileSize?: number;
    downloadUrl?: string;
    recordCount?: number;
    options: ExportOptions;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
    expiresAt: Date;
};

export type ExportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export type ExportProgress = {
    jobId: string;
    status: ExportJobStatus;
    progress: number;
    message?: string;
    estimatedTimeRemaining?: number;
};

export type ExportTemplate = {
    id: string;
    name: string;
    description?: string;
    options: ExportOptions;
    isDefault: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateExportJobRequest = {
    options: ExportOptions;
    templateId?: string;
};

export type ExportFieldMapping = {
    [key: string]: {
        label: string;
        type: ExportField['type'];
        format?: string;
        transform?: (value: unknown) => unknown;
    };
};

export type ExportStats = {
    totalExports: number;
    successRate: number;
    averageFileSize: number;
    popularFormats: Record<ExportFormat, number>;
    recentExports: ExportJob[];
}; 