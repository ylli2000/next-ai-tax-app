import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import isTodayPlugin from "dayjs/plugin/isToday";
import isYesterdayPlugin from "dayjs/plugin/isYesterday";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import weekday from "dayjs/plugin/weekday";
import { AUSTRALIAN_TAX_CONSTANTS } from "@/schema/financialSchema";
import { DateFormatEnum, DATE_FORMATS, DateRange } from "@/schema/dateSchema";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(isTodayPlugin);
dayjs.extend(isYesterdayPlugin);
dayjs.extend(weekday);
dayjs.extend(advancedFormat);
dayjs.extend(quarterOfYear);

/**
 * Date utility functions for invoice management system
 */

/**
 * Get current date in ISO format
 */
export const now = (): string => dayjs().toISOString();

/**
 * Get current date in UTC
 */
export const nowUtc = (): string => dayjs.utc().toISOString();

/**
 * Format date for display
 */
export const formatDisplay = (date: string | Date): string =>
    dayjs(date).format(DATE_FORMATS.DISPLAY);

/**
 * Format date and time for display (Australian format)
 */
export const formatDisplayDateTime = (date: string | Date): string =>
    dayjs(date).format(DATE_FORMATS.DISPLAY_WITH_TIME);

/**
 * Format date for ISO string
 */
export const formatISO = (date: string | Date): string =>
    dayjs(date).format(DATE_FORMATS.ISO);

/**
 * Parse date string with custom format
 */
export const parseCustomFormat = (
    dateString: string,
    format: string,
): dayjs.Dayjs => dayjs(dateString, format);

/**
 * Convert date to UTC
 */
export const toUtc = (date: string | Date): string =>
    dayjs(date).utc().format();

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string =>
    dayjs(date).fromNow();

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => dayjs(date).isToday();

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: string | Date): boolean =>
    dayjs(date).isYesterday();

/**
 * Check if date is in current week
 */
export const isThisWeek = (date: string | Date): boolean => {
    const now = dayjs();
    const startOfWeek = now.startOf("week");
    const endOfWeek = now.endOf("week");
    const inputDate = dayjs(date);

    return inputDate.isAfter(startOfWeek) && inputDate.isBefore(endOfWeek);
};

/**
 * Check if date is in current month
 */
export const isThisMonth = (date: string | Date): boolean =>
    dayjs(date).isSame(dayjs(), "month");

/**
 * Check if date is in current year
 */
export const isThisYear = (date: string | Date): boolean =>
    dayjs(date).isSame(dayjs(), "year");

/**
 * Get start of day
 */
export const startOfDay = (date: string | Date): string =>
    dayjs(date).startOf("day").toISOString();

/**
 * Get end of day
 */
export const endOfDay = (date: string | Date): string =>
    dayjs(date).endOf("day").toISOString();

/**
 * Get start of month
 */
export const startOfMonth = (date: string | Date): string =>
    dayjs(date).startOf("month").toISOString();

/**
 * Get end of month
 */
export const endOfMonth = (date: string | Date): string =>
    dayjs(date).endOf("month").toISOString();

/**
 * Get start of year
 */
export const startOfYear = (date: string | Date): string =>
    dayjs(date).startOf("year").toISOString();

/**
 * Get end of year
 */
export const endOfYear = (date: string | Date): string =>
    dayjs(date).endOf("year").toISOString();

/**
 * Add time to date
 */
export const add = (
    date: string | Date,
    amount: number,
    unit: dayjs.ManipulateType,
): string => dayjs(date).add(amount, unit).toISOString();

/**
 * Subtract time from date
 */
export const subtract = (
    date: string | Date,
    amount: number,
    unit: dayjs.ManipulateType,
): string => dayjs(date).subtract(amount, unit).toISOString();

/**
 * Get difference between two dates
 */
export const diff = (
    date1: string | Date,
    date2: string | Date,
    unit?: dayjs.QUnitType,
): number => dayjs(date1).diff(date2, unit);

/**
 * Check if date is valid
 */
export const isValid = (date: string | Date): boolean => dayjs(date).isValid();

/**
 * Get duration between two dates
 */
export const getDuration = (
    start: string | Date,
    end: string | Date,
): Duration => {
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    const diffInMs = endDate.diff(startDate);

    return dayjs.duration(diffInMs);
};

/**
 * Format duration in human readable format
 */
export const formatDuration = (duration: Duration): string => {
    if (duration.asDays() >= 1) {
        return `${Math.floor(duration.asDays())} days`;
    } else if (duration.asHours() >= 1) {
        return `${Math.floor(duration.asHours())} hours`;
    } else if (duration.asMinutes() >= 1) {
        return `${Math.floor(duration.asMinutes())} minutes`;
    } else {
        return `${Math.floor(duration.asSeconds())} seconds`;
    }
};

/**
 * Get date range for common periods
 */
export const getDateRange = (
    period: DateRange,
): {
    start: string;
    end: string;
} => {
    const now = dayjs();

    switch (period) {
        case "today":
            return {
                start: now.startOf("day").toISOString(),
                end: now.endOf("day").toISOString(),
            };
        case "yesterday":
            const yesterday = now.subtract(1, "day");
            return {
                start: yesterday.startOf("day").toISOString(),
                end: yesterday.endOf("day").toISOString(),
            };
        case "thisWeek":
            return {
                start: now.startOf("week").toISOString(),
                end: now.endOf("week").toISOString(),
            };
        case "lastWeek":
            const lastWeek = now.subtract(1, "week");
            return {
                start: lastWeek.startOf("week").toISOString(),
                end: lastWeek.endOf("week").toISOString(),
            };
        case "thisMonth":
            return {
                start: now.startOf("month").toISOString(),
                end: now.endOf("month").toISOString(),
            };
        case "lastMonth":
            const lastMonth = now.subtract(1, "month");
            return {
                start: lastMonth.startOf("month").toISOString(),
                end: lastMonth.endOf("month").toISOString(),
            };
        case "thisYear":
            return {
                start: now.startOf("year").toISOString(),
                end: now.endOf("year").toISOString(),
            };
        case "lastYear":
            const lastYear = now.subtract(1, "year");
            return {
                start: lastYear.startOf("year").toISOString(),
                end: lastYear.endOf("year").toISOString(),
            };
        default:
            return {
                start: now.startOf("day").toISOString(),
                end: now.endOf("day").toISOString(),
            };
    }
};

/**
 * Parse various date formats commonly found in invoices
 */
export const parseInvoiceDate = (dateString: string): string | null => {
    for (const format of DateFormatEnum) {
        const parsed = dayjs(dateString, format, true);
        if (parsed.isValid()) {
            return parsed.toISOString();
        }
    }

    // Try natural parsing as fallback
    const naturalParsed = dayjs(dateString);
    if (naturalParsed.isValid()) {
        return naturalParsed.toISOString();
    }

    return null;
};

/**
 * Get fiscal year based on date
 */
export const getFiscalYear = (
    date: string | Date,
    fiscalYearStart = 1,
): number => {
    const d = dayjs(date);
    if (d.month() + 1 >= fiscalYearStart) {
        return d.year();
    } else {
        return d.year() - 1;
    }
};

/**
 * Get quarter based on date
 */
export const getQuarter = (date: string | Date): number =>
    dayjs(date).quarter();

/**
 * Check if date is a weekend
 */
export const isWeekend = (date: string | Date): boolean => {
    const dayOfWeek = dayjs(date).day();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
};

/**
 * Get next business day (skip weekends)
 */
export const getNextBusinessDay = (date: string | Date): string => {
    let nextDay = dayjs(date).add(1, "day");

    while (isWeekend(nextDay.toISOString())) {
        nextDay = nextDay.add(1, "day");
    }

    return nextDay.toISOString();
};

/**
 * Get previous business day (skip weekends)
 */
export const getPreviousBusinessDay = (date: string | Date): string => {
    let prevDay = dayjs(date).subtract(1, "day");

    while (isWeekend(prevDay.toISOString())) {
        prevDay = prevDay.subtract(1, "day");
    }

    return prevDay.toISOString();
};

/**
 * Format date for file name (safe, sortable)
 */
export const formatFileISOString = (date: string | Date): string =>
    dayjs(date).format(DATE_FORMATS.FILE_NAME);

/**
 * Get Australian financial year (July 1 - June 30)
 * Returns the starting year of the financial year
 */
export const getAustralianFinancialYear = (date?: string | Date): number => {
    const d = date ? dayjs(date) : dayjs();
    const month = d.month() + 1; // dayjs months are 0-indexed
    if (month >= AUSTRALIAN_TAX_CONSTANTS.FINANCIAL_YEAR.START_MONTH)
        return d.year();
    else return d.year() - 1;
};

/**
 * Get Australian financial year as string format (e.g., "2024-2025")
 */
export const getAustralianFinancialYearString = (
    date?: string | Date,
): string => {
    const startYear = getAustralianFinancialYear(date);
    return `${startYear}-${startYear + 1}`;
};

/**
 * Get Australian financial year date range
 */
export const getAustralianFinancialYearRange = (
    date?: string | Date,
): { start: string; end: string } => {
    const startYear = getAustralianFinancialYear(date);
    return {
        start: dayjs(
            `${startYear}-${String(AUSTRALIAN_TAX_CONSTANTS.FINANCIAL_YEAR.START_MONTH).padStart(2, "0")}-${String(AUSTRALIAN_TAX_CONSTANTS.FINANCIAL_YEAR.START_DAY).padStart(2, "0")}`,
        )
            .startOf("day")
            .toISOString(),
        end: dayjs(
            `${startYear + 1}-${String(AUSTRALIAN_TAX_CONSTANTS.FINANCIAL_YEAR.END_MONTH).padStart(2, "0")}-${String(AUSTRALIAN_TAX_CONSTANTS.FINANCIAL_YEAR.END_DAY).padStart(2, "0")}`,
        )
            .endOf("day")
            .toISOString(),
    };
};

/**
 * Check if date is in current Australian financial year
 */
export const isCurrentAustralianFinancialYear = (
    date: string | Date,
): boolean => {
    const inputYear = getAustralianFinancialYear(date);
    const currentYear = getAustralianFinancialYear();
    return inputYear === currentYear;
};

// Type for dayjs duration
export type Duration = ReturnType<typeof dayjs.duration>;

// Export dayjs instance for direct use if needed
export { dayjs };

// Helper functions for common date operations with default settings
/**
 * Format date for form inputs (HTML input type="date")
 */
export const forInput = (date: string | Date): string =>
    dayjs(date).format(DATE_FORMATS.INPUT);

/**
 * Format date for API (ISO string)
 */
export const forApi = (date: string | Date): string =>
    dayjs(date).toISOString();

/**
 * Format date for display in tables (Australian format)
 */
export const forTable = (date: string | Date): string =>
    dayjs(date).format(DATE_FORMATS.DISPLAY);

/**
 * Format date for file names
 */
export const forFileName = (date: string | Date): string =>
    dayjs(date).format(DATE_FORMATS.FILE_NAME);

/**
 * Smart date formatting based on recency
 */
export const smart = (date: string | Date): string => {
    const d = dayjs(date);
    if (d.isToday()) return d.format(DATE_FORMATS.TODAY_AT_TIME);
    else if (d.isYesterday()) return d.format(DATE_FORMATS.YESTERDAY_AT_TIME);
    else if (isThisWeek(date)) return d.format(DATE_FORMATS.DAY_AT_TIME);
    else if (isThisYear(date)) return d.format(DATE_FORMATS.MONTH_AT_TIME);
    else return d.format(DATE_FORMATS.LONG_AT_TIME);
};
