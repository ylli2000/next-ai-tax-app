export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';

export type Language = 'en' | 'zh';

export type ToastType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';

export type Toast = {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
    action?: ToastAction;
};

export type ToastAction = {
    label: string;
    onClick: () => void;
};

export type Modal = {
    id: string;
    isOpen: boolean;
    title?: string;
    content?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closable?: boolean;
    onClose?: () => void;
};

export type LoadingState = {
    isLoading: boolean;
    message?: string;
    progress?: number;
};

export type UIState = {
    theme: Theme;
    language: Language;
    sidebarCollapsed: boolean;
    loadingStates: Record<string, LoadingState>;
    toasts: Toast[];
    modals: Modal[];
};

export type ConfirmationDialog = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
    onCancel?: () => void;
};

export type FilterState = {
    searchTerm: string;
    categories: string[];
    dateRange: {
        from?: Date;
        to?: Date;
    };
    amountRange: {
        min?: number;
        max?: number;
    };
    suppliers: string[];
    tags: string[];
    status: string[];
};

export type SortState = {
    field: string;
    direction: 'asc' | 'desc';
};

export type TableState = {
    filters: FilterState;
    sort: SortState;
    pagination: {
        page: number;
        pageSize: number;
    };
    selectedRows: string[];
};

export type FormState = {
    isDirty: boolean;
    isSubmitting: boolean;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
};

export type NavigationItem = {
    id: string;
    label: string;
    href: string;
    icon?: React.ComponentType;
    badge?: string | number;
    children?: NavigationItem[];
    requiresAuth?: boolean;
    roles?: string[];
};

export type BreadcrumbItem = {
    label: string;
    href?: string;
    isActive?: boolean;
}; 