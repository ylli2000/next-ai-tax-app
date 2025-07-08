import { z } from "zod";
import { type SortOrder } from "./commonSchemas";
// Re-export sort direction from commonSchemas
export { SortOrder };

// UI Constants
export const UI_CONSTANTS = {
    DEFAULT_LANGUAGE: "en" as Language, // Used in user profile initialization and i18n setup
    DEFAULT_THEME: "SYSTEM" as Theme, // Used in UI theme provider for system preference detection
    DEFAULT_CURRENCY_LOCALE: "en-AU" as CurrencyLocale, // Used in Intl.NumberFormat for currency display
    TOAST_DURATION: 5000, // Used in toast notifications for auto-dismiss timing (ms)
    ANIMATION_DURATION: 300, // Used in UI transitions and loading animations (ms)
    DEBOUNCE_DELAY: 300, // Used in search inputs and form validation debouncing (ms)
    DEFAULT_CATEGORY_IS_DEFAULT: true, // Used in category creation for custom vs default categories
    DEFAULT_NOTIFICATIONS_ENABLED: true, // Used in user preference initialization
} as const;
// Theme enum
export const ThemeEnum = ["LIGHT", "DARK", "SYSTEM"] as const;
export const themeSchema = z.enum(ThemeEnum);
export type Theme = z.infer<typeof themeSchema>;

// Language enum
export const LanguageEnum = ["en", "zh"] as const;
export const languageSchema = z.enum(LanguageEnum);
export type Language = z.infer<typeof languageSchema>;

// Currency Locale enum
export const CurrencyLocaleEnum = ["en-AU", "zh-US"] as const;
export const currencyLocaleSchema = z.enum(CurrencyLocaleEnum);
export type CurrencyLocale = z.infer<typeof currencyLocaleSchema>;

// Toast Type enum
export const ToastTypeEnum = ["SUCCESS", "ERROR", "WARNING", "INFO"] as const;
export const toastTypeSchema = z.enum(ToastTypeEnum);
export type ToastType = z.infer<typeof toastTypeSchema>;

// Modal Size enum
export const ModalSizeEnum = ["sm", "md", "lg", "xl", "full"] as const;
export const modalSizeSchema = z.enum(ModalSizeEnum);
export type ModalSize = z.infer<typeof modalSizeSchema>;

// Dialog Variant enum
export const DialogVariantEnum = ["default", "destructive"] as const;
export const dialogVariantSchema = z.enum(DialogVariantEnum);
export type DialogVariant = z.infer<typeof dialogVariantSchema>;

// These are Props for the UI components, zod schema is not applicable for them
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
    size?: ModalSize;
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
    variant?: DialogVariant;
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
    direction: SortOrder;
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
