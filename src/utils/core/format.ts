import {
    FINANCIAL_CONSTANTS,
    PRECISION_CONSTANTS,
} from "@/schema/financialSchema";
import { INVOICE_CONSTANTS } from "@/schema/invoiceSchema";
import { UI_CONSTANTS } from "@/schema/uiSchema";
import { FILE_SIZE_CONSTANTS } from "@/schema/uploadSchema";

/**
 * Sanitize HTML input （e.g. description input)
 */
export const sanitizeHtml = (input: string): string =>
    input
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");

/**
 * Format currency amount
 */
export const formatCurrency = (
    amount: number,
    currency: string = FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
    locale: string = UI_CONSTANTS.DEFAULT_CURRENCY_LOCALE,
): string => {
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            minimumFractionDigits: PRECISION_CONSTANTS.DECIMAL_SCALE,
            maximumFractionDigits: PRECISION_CONSTANTS.DECIMAL_SCALE,
        }).format(amount);
    } catch {
        // Fallback formatting if Intl fails
        return `${currency} ${amount.toFixed(PRECISION_CONSTANTS.DECIMAL_SCALE)}`;
    }
};

/**
 * Format number with thousands separators
 */
export const formatNumber = (
    value: number,
    locale: string = UI_CONSTANTS.DEFAULT_CURRENCY_LOCALE,
    minimumFractionDigits: number = 0,
    maximumFractionDigits: number = 2,
): string => {
    try {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(value);
    } catch {
        return value.toFixed(maximumFractionDigits);
    }
};

/**
 * Format percentage
 */
export const formatPercentage = (
    value: number,
    locale: string = UI_CONSTANTS.DEFAULT_CURRENCY_LOCALE,
    maximumFractionDigits: number = 2,
): string => {
    try {
        return new Intl.NumberFormat(locale, {
            style: "percent",
            maximumFractionDigits,
        }).format(value / 100);
    } catch {
        return `${value.toFixed(maximumFractionDigits)}%`;
    }
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";

    const k = FILE_SIZE_CONSTANTS.BYTES_PER_KB;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${value} ${sizes[i]}`;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Check for different phone number lengths and format accordingly
    if (cleaned.length === 10) {
        // US format: (123) 456-7890
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
        // US format with country code: +1 (123) 456-7890
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else {
        // International format: add spaces every 3-4 digits
        return cleaned.replace(/(\d{1,4})(?=(\d{3,4})+(?!\d))/g, "$1 ").trim();
    }
};

/**
 * Format text to title case
 */
export const toTitleCase = (text: string): string =>
    text.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
    );

/**
 * Format text to sentence case
 */
export const toSentenceCase = (text: string): string =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

/**
 * Truncate text with ellipsis
 */
export const truncateText = (
    text: string,
    maxLength: number,
    suffix: string = INVOICE_CONSTANTS.TRUNCATE_SUFFIX,
): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Format camelCase to readable text
 */
export const camelCaseToReadable = (text: string): string =>
    text
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

/**
 * Format snake_case to readable text
 */
export const snakeCaseToReadable = (text: string): string =>
    text
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");

/**
 * Format kebab-case to readable text
 */
export const kebabCaseToReadable = (text: string): string =>
    text
        .split("-")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");

/**
 * Format duration in milliseconds to human readable format
 */
export const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

/**
 * Format array to readable list
 */
export const formatList = (
    items: string[],
    conjunction: "and" | "or" = "and",
    locale: string = UI_CONSTANTS.DEFAULT_CURRENCY_LOCALE,
): string => {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

    try {
        // Use Intl.ListFormat if available
        return new Intl.ListFormat(locale, {
            style: "long",
            type: conjunction === "and" ? "conjunction" : "disjunction",
        }).format(items);
    } catch {
        // Fallback for browsers that don't support Intl.ListFormat
        const lastItem = items.pop();
        return `${items.join(", ")}, ${conjunction} ${lastItem}`;
    }
};

/**
 * Format address to single line
 */
export const formatAddress = (addressParts: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
}): string => {
    const parts = [
        addressParts.street,
        addressParts.city,
        addressParts.state,
        addressParts.zipCode,
        addressParts.country,
    ].filter(Boolean);

    return parts.join(", ");
};

/**
 * Format initials from name
 */
export const getInitials = (name: string, maxInitials: number = 2): string =>
    name
        .split(" ")
        .filter((word) => word.length > 0)
        .slice(0, maxInitials)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");

/**
 * Format status badge text
 */
export const formatStatusBadge = (status: string): string =>
    status
        .replace(/[_-]/g, " ")
        .split(" ")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");

/**
 * Format invoice number with prefix
 */
export const formatInvoiceNumber = (
    number: string | number,
    prefix: string = INVOICE_CONSTANTS.INVOICE_PREFIX,
): string => {
    const paddedNumber = String(number).padStart(
        INVOICE_CONSTANTS.INVOICE_NUMBER_PADDING,
        "0",
    );
    return `${prefix}-${paddedNumber}`;
};

/**
 * Format tax ID/number
 */
export const formatTaxId = (taxId: string): string => {
    // Remove all non-alphanumeric characters
    const cleaned = taxId.replace(/[^A-Za-z0-9]/g, "");

    // Format based on common patterns
    if (cleaned.length === 9 && /^\d+$/.test(cleaned)) {
        // US EIN format: 12-3456789
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else if (cleaned.length === 11 && /^\d+$/.test(cleaned)) {
        // US SSN format: 123-45-6789
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    } else {
        // Generic format: add hyphens every 4 characters
        return cleaned.replace(/(.{4})/g, "$1-").replace(/-$/, "");
    }
};

/**
 * Format credit card number (with masking)
 */
export const formatCreditCard = (
    cardNumber: string,
    showLast: number = 4,
): string => {
    const cleaned = cardNumber.replace(/\D/g, "");
    const masked = "*".repeat(Math.max(0, cleaned.length - showLast));
    const visible = cleaned.slice(-showLast);
    const combined = masked + visible;

    // Add spaces every group size digits
    const regex = new RegExp(
        `(.{${INVOICE_CONSTANTS.CREDIT_CARD_GROUP_SIZE}})`,
        "g",
    );
    return combined.replace(regex, "$1 ").trim();
};

/**
 * Format relative file path
 */
export const formatFilePath = (
    path: string,
    maxSegments: number = 3,
): string => {
    const segments = path.split("/").filter(Boolean);

    if (segments.length <= maxSegments) {
        return path;
    }

    const visibleSegments = segments.slice(-maxSegments);
    return `.../${visibleSegments.join("/")}`;
};

/**
 * Format text with highlighting
 */
export const highlightText = (
    text: string,
    query: string,
    highlightClass: string = "highlight",
): string => {
    if (!query) return text;

    const regex = new RegExp(
        `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
    );
    return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
};

/**
 * Format markdown-like text to HTML
 */
export const formatSimpleMarkdown = (text: string): string =>
    text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");

/**
 * Formatting helpers with default settings
 */

// Currency with default settings
export const formatCurrencyDefault = (amount: number): string =>
    formatCurrency(amount);

// File size formatting
export const formatFileSizeDefault = (bytes: number): string =>
    formatFileSize(bytes);

// Percentage formatting
export const formatPercentageDefault = (value: number): string =>
    formatPercentage(value);

// Number with thousands separators
export const formatNumberDefault = (value: number): string =>
    formatNumber(value);

// Truncate text to default length
export const truncateDefault = (
    text: string,
    length: number = INVOICE_CONSTANTS.DEFAULT_TRUNCATE_LENGTH,
): string => truncateText(text, length);

// Title case formatting
export const formatTitle = (text: string): string => toTitleCase(text);

// Get initials from name
export const formatInitials = (name: string): string => getInitials(name);

// Format phone number
export const formatPhone = (phoneNumber: string): string =>
    formatPhoneNumber(phoneNumber);

// Format status for display
export const formatStatus = (status: string): string =>
    formatStatusBadge(status);
