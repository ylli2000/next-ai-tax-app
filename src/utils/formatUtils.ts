import { CURRENCY_CONSTANTS, FILE_SIZE_CONSTANTS } from './constants';

/**
 * Formatting utility functions for the invoice management system
 */
export class FormatUtils {
  /**
   * Format currency amount
   */
  static formatCurrency(
    amount: number,
    currency: string = CURRENCY_CONSTANTS.DEFAULT_CURRENCY,
    locale: string = CURRENCY_CONSTANTS.DEFAULT_CURRENCY_LOCALE
  ): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: CURRENCY_CONSTANTS.DECIMAL_PLACES,
        maximumFractionDigits: CURRENCY_CONSTANTS.DECIMAL_PLACES,
      }).format(amount);
    } catch {
      // Fallback formatting if Intl fails
      return `${currency} ${amount.toFixed(CURRENCY_CONSTANTS.DECIMAL_PLACES)}`;
    }
  }

  /**
   * Format number with thousands separators
   */
  static formatNumber(
    value: number,
    locale: string = CURRENCY_CONSTANTS.DEFAULT_CURRENCY_LOCALE,
    minimumFractionDigits: number = 0,
    maximumFractionDigits: number = 2
  ): string {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(value);
    } catch {
      return value.toFixed(maximumFractionDigits);
    }
  }

  /**
   * Format percentage
   */
  static formatPercentage(
    value: number,
    locale: string = CURRENCY_CONSTANTS.DEFAULT_CURRENCY_LOCALE,
    maximumFractionDigits: number = 2
  ): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits,
      }).format(value / 100);
    } catch {
      return `${value.toFixed(maximumFractionDigits)}%`;
    }
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = FILE_SIZE_CONSTANTS.BYTES_PER_KB;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${value} ${sizes[i]}`;
  }

  /**
   * Format phone number
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check for different phone number lengths and format accordingly
    if (cleaned.length === 10) {
      // US format: (123) 456-7890
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US format with country code: +1 (123) 456-7890
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else {
      // International format: add spaces every 3-4 digits
      return cleaned.replace(/(\d{1,4})(?=(\d{3,4})+(?!\d))/g, '$1 ').trim();
    }
  }

  /**
   * Format text to title case
   */
  static toTitleCase(text: string): string {
    return text.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Format text to sentence case
   */
  static toSentenceCase(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Format camelCase to readable text
   */
  static camelCaseToReadable(text: string): string {
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format snake_case to readable text
   */
  static snakeCaseToReadable(text: string): string {
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Format kebab-case to readable text
   */
  static kebabCaseToReadable(text: string): string {
    return text
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  static formatDuration(milliseconds: number): string {
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
  }

  /**
   * Format array to readable list
   */
  static formatList(
    items: string[],
    conjunction: 'and' | 'or' = 'and',
    locale: string = CURRENCY_CONSTANTS.DEFAULT_CURRENCY_LOCALE
  ): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

    try {
      // Use Intl.ListFormat if available
      return new Intl.ListFormat(locale, { 
        style: 'long', 
        type: conjunction === 'and' ? 'conjunction' : 'disjunction' 
      }).format(items);
    } catch {
      // Fallback for browsers that don't support Intl.ListFormat
      const lastItem = items.pop();
      return `${items.join(', ')}, ${conjunction} ${lastItem}`;
    }
  }

  /**
   * Format address to single line
   */
  static formatAddress(addressParts: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }): string {
    const parts = [
      addressParts.street,
      addressParts.city,
      addressParts.state,
      addressParts.zipCode,
      addressParts.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Format initials from name
   */
  static getInitials(name: string, maxInitials: number = 2): string {
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .slice(0, maxInitials)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Format status badge text
   */
  static formatStatusBadge(status: string): string {
    return status
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Format invoice number with prefix
   */
  static formatInvoiceNumber(number: string | number, prefix: string = 'INV'): string {
    const paddedNumber = String(number).padStart(6, '0');
    return `${prefix}-${paddedNumber}`;
  }

  /**
   * Format tax ID/number
   */
  static formatTaxId(taxId: string): string {
    // Remove all non-alphanumeric characters
    const cleaned = taxId.replace(/[^A-Za-z0-9]/g, '');
    
    // Format based on common patterns
    if (cleaned.length === 9 && /^\d+$/.test(cleaned)) {
      // US EIN format: 12-3456789
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else if (cleaned.length === 11 && /^\d+$/.test(cleaned)) {
      // US SSN format: 123-45-6789
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    } else {
      // Generic format: add hyphens every 4 characters
      return cleaned.replace(/(.{4})/g, '$1-').replace(/-$/, '');
    }
  }

  /**
   * Format credit card number (with masking)
   */
  static formatCreditCard(cardNumber: string, showLast: number = 4): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    const masked = '*'.repeat(Math.max(0, cleaned.length - showLast));
    const visible = cleaned.slice(-showLast);
    const combined = masked + visible;
    
    // Add spaces every 4 digits
    return combined.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Format relative file path
   */
  static formatFilePath(path: string, maxSegments: number = 3): string {
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length <= maxSegments) {
      return path;
    }
    
    const visibleSegments = segments.slice(-maxSegments);
    return `.../${visibleSegments.join('/')}`;
  }

  /**
   * Format text with highlighting
   */
  static highlightText(text: string, query: string, highlightClass: string = 'highlight'): string {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
  }

  /**
   * Format markdown-like text to HTML
   */
  static formatSimpleMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Format color for display
   */
  static formatColorName(hex: string): string {
    const colorNames: Record<string, string> = {
      '#FF0000': 'Red',
      '#00FF00': 'Green', 
      '#0000FF': 'Blue',
      '#FFFF00': 'Yellow',
      '#FF00FF': 'Magenta',
      '#00FFFF': 'Cyan',
      '#000000': 'Black',
      '#FFFFFF': 'White',
      '#808080': 'Gray',
      '#FFA500': 'Orange',
      '#800080': 'Purple',
      '#FFC0CB': 'Pink',
      '#A52A2A': 'Brown',
      '#808000': 'Olive',
    };

    return colorNames[hex.toUpperCase()] || hex;
  }
}

/**
 * Common formatting helpers
 */
export const formatHelpers = {
  /**
   * Currency with default settings
   */
  currency: (amount: number) => FormatUtils.formatCurrency(amount),
  
  /**
   * File size formatting
   */
  fileSize: (bytes: number) => FormatUtils.formatFileSize(bytes),
  
  /**
   * Percentage formatting
   */
  percentage: (value: number) => FormatUtils.formatPercentage(value),
  
  /**
   * Number with thousands separators
   */
  number: (value: number) => FormatUtils.formatNumber(value),
  
  /**
   * Truncate text to 50 characters
   */
  truncate: (text: string, length: number = 50) => FormatUtils.truncateText(text, length),
  
  /**
   * Title case formatting
   */
  title: (text: string) => FormatUtils.toTitleCase(text),
  
  /**
   * Get initials from name
   */
  initials: (name: string) => FormatUtils.getInitials(name),
  
  /**
   * Format phone number
   */
  phone: (phoneNumber: string) => FormatUtils.formatPhoneNumber(phoneNumber),
  
  /**
   * Format status for display
   */
  status: (status: string) => FormatUtils.formatStatusBadge(status),
}; 