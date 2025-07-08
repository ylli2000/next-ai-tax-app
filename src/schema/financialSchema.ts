import { z } from "zod";

export const FINANCIAL_CONSTANTS = {
    DEFAULT_CURRENCY: "AUD" as SupportedCurrency, // Used in formatUtils.ts and invoice creation default
} as const;

// Currency enum
export const SupportedCurrencyEnum = [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "JPY",
    "CNY",
] as const;
export const supportedCurrencySchema = z.enum(SupportedCurrencyEnum);
export type SupportedCurrency = z.infer<typeof supportedCurrencySchema>;

// Australian Tax Constants - Only Australian GST is deductible for Australian tax reporting
export const AUSTRALIAN_TAX_CONSTANTS = {
    GST_RATE_PERCENTAGE: 10, // Used in tax calculations and GST validation
    ABN_REGEX: /^\d{11}$/, // Used in supplier ABN validation and form validation
    // Australian Financial Year constants (July 1 - June 30) - used in dateUtils.ts and reporting
    FINANCIAL_YEAR: {
        START_MONTH: 7, // Used in dateUtils.ts getAustralianFinancialYear functions
        START_DAY: 1, // Used in financial year range calculations
        END_MONTH: 6, // Used in dateUtils.ts getAustralianFinancialYear functions
        END_DAY: 30, // Used in financial year range calculations
    },
    // Note: International invoices may show foreign taxes (VAT, Sales Tax, etc.)
    // but these cannot be claimed as tax deductions in Australian tax returns
} as const;

// Financial Precision Constants
export const PRECISION_CONSTANTS = {
    DECIMAL_PRECISION: 12, // Used in Drizzle ORM decimal columns for invoice amounts
    DECIMAL_SCALE: 2, // Used in Drizzle ORM for currency decimal places (e.g., $12.34)
    TAX_RATE_PRECISION: 5, // Used in Drizzle ORM for tax rate storage (e.g., 10.25%)
    TAX_RATE_SCALE: 4, // Used in Drizzle ORM for tax rate decimal precision
    CONFIDENCE_PRECISION: 5, // Used in Drizzle ORM for AI confidence scores (0.9999)
    CONFIDENCE_SCALE: 4, // Used in Drizzle ORM for AI confidence decimal places
} as const;
