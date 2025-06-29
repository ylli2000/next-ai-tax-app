import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';

import quarterOfYear from 'dayjs/plugin/quarterOfYear';

import { COMMON_DATE_FORMATS, DATE_FORMATS } from './constants';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);
dayjs.extend(advancedFormat);
dayjs.extend(quarterOfYear);

/**
 * Date utility functions for invoice management system
 */
export class DateUtils {
  /**
   * Get current date in ISO format
   */
  static now(): string {
    return dayjs().toISOString();
  }

  /**
   * Get current date in UTC
   */
  static nowUtc(): string {
    return dayjs.utc().toISOString();
  }

  /**
   * Format date for display
   */
  static formatDisplay(date: string | Date): string {
    return dayjs(date).format(DATE_FORMATS.DISPLAY);
  }

  /**
   * Format date and time for display (Australian format)
   */
  static formatDisplayDateTime(date: string | Date): string {
    return dayjs(date).format('DD/MM/YYYY [at] h:mm A');
  }

  /**
   * Format date for ISO string
   */
  static formatISO(date: string | Date): string {
    return dayjs(date).format(DATE_FORMATS.ISO);
  }

  /**
   * Parse date string with custom format
   */
  static parseCustomFormat(dateString: string, format: string): dayjs.Dayjs {
    return dayjs(dateString, format);
  }

  /**
   * Convert date to specific timezone
   */
  static toTimezone(date: string | Date, timezone: string): string {
    return dayjs(date).tz(timezone).format();
  }

  /**
   * Convert date to UTC
   */
  static toUtc(date: string | Date): string {
    return dayjs(date).utc().format();
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  static getRelativeTime(date: string | Date): string {
    return dayjs(date).fromNow();
  }

  /**
   * Check if date is today
   */
  static isToday(date: string | Date): boolean {
    return dayjs(date).isToday();
  }

  /**
   * Check if date is yesterday
   */
  static isYesterday(date: string | Date): boolean {
    return dayjs(date).isYesterday();
  }

  /**
   * Check if date is in current week
   */
  static isThisWeek(date: string | Date): boolean {
    const now = dayjs();
    const startOfWeek = now.startOf('week');
    const endOfWeek = now.endOf('week');
    const inputDate = dayjs(date);
    
    return inputDate.isAfter(startOfWeek) && inputDate.isBefore(endOfWeek);
  }

  /**
   * Check if date is in current month
   */
  static isThisMonth(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs(), 'month');
  }

  /**
   * Check if date is in current year
   */
  static isThisYear(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs(), 'year');
  }

  /**
   * Get start of day
   */
  static startOfDay(date: string | Date): string {
    return dayjs(date).startOf('day').toISOString();
  }

  /**
   * Get end of day
   */
  static endOfDay(date: string | Date): string {
    return dayjs(date).endOf('day').toISOString();
  }

  /**
   * Get start of month
   */
  static startOfMonth(date: string | Date): string {
    return dayjs(date).startOf('month').toISOString();
  }

  /**
   * Get end of month
   */
  static endOfMonth(date: string | Date): string {
    return dayjs(date).endOf('month').toISOString();
  }

  /**
   * Get start of year
   */
  static startOfYear(date: string | Date): string {
    return dayjs(date).startOf('year').toISOString();
  }

  /**
   * Get end of year
   */
  static endOfYear(date: string | Date): string {
    return dayjs(date).endOf('year').toISOString();
  }

  /**
   * Add time to date
   */
  static add(date: string | Date, amount: number, unit: dayjs.ManipulateType): string {
    return dayjs(date).add(amount, unit).toISOString();
  }

  /**
   * Subtract time from date
   */
  static subtract(date: string | Date, amount: number, unit: dayjs.ManipulateType): string {
    return dayjs(date).subtract(amount, unit).toISOString();
  }

  /**
   * Get difference between two dates
   */
  static diff(date1: string | Date, date2: string | Date, unit?: dayjs.QUnitType): number {
    return dayjs(date1).diff(date2, unit);
  }

  /**
   * Check if date is valid
   */
  static isValid(date: string | Date): boolean {
    return dayjs(date).isValid();
  }

  /**
   * Get duration between two dates
   */
  static getDuration(start: string | Date, end: string | Date): Duration {
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    const diffInMs = endDate.diff(startDate);
    
    return dayjs.duration(diffInMs);
  }

  /**
   * Format duration in human readable format
   */
  static formatDuration(duration: Duration): string {
    if (duration.asDays() >= 1) {
      return `${Math.floor(duration.asDays())} days`;
    } else if (duration.asHours() >= 1) {
      return `${Math.floor(duration.asHours())} hours`;
    } else if (duration.asMinutes() >= 1) {
      return `${Math.floor(duration.asMinutes())} minutes`;
    } else {
      return `${Math.floor(duration.asSeconds())} seconds`;
    }
  }

  /**
   * Get date range for common periods
   */
  static getDateRange(period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'): {
    start: string;
    end: string;
  } {
    const now = dayjs();

    switch (period) {
      case 'today':
        return {
          start: now.startOf('day').toISOString(),
          end: now.endOf('day').toISOString(),
        };
      case 'yesterday':
        const yesterday = now.subtract(1, 'day');
        return {
          start: yesterday.startOf('day').toISOString(),
          end: yesterday.endOf('day').toISOString(),
        };
      case 'thisWeek':
        return {
          start: now.startOf('week').toISOString(),
          end: now.endOf('week').toISOString(),
        };
      case 'lastWeek':
        const lastWeek = now.subtract(1, 'week');
        return {
          start: lastWeek.startOf('week').toISOString(),
          end: lastWeek.endOf('week').toISOString(),
        };
      case 'thisMonth':
        return {
          start: now.startOf('month').toISOString(),
          end: now.endOf('month').toISOString(),
        };
      case 'lastMonth':
        const lastMonth = now.subtract(1, 'month');
        return {
          start: lastMonth.startOf('month').toISOString(),
          end: lastMonth.endOf('month').toISOString(),
        };
      case 'thisYear':
        return {
          start: now.startOf('year').toISOString(),
          end: now.endOf('year').toISOString(),
        };
      case 'lastYear':
        const lastYear = now.subtract(1, 'year');
        return {
          start: lastYear.startOf('year').toISOString(),
          end: lastYear.endOf('year').toISOString(),
        };
      default:
        return {
          start: now.startOf('day').toISOString(),
          end: now.endOf('day').toISOString(),
        };
    }
  }

  /**
   * Parse various date formats commonly found in invoices
   */
  static parseInvoiceDate(dateString: string): string | null {


    for (const format of COMMON_DATE_FORMATS) {
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
  }

  /**
   * Get fiscal year based on date
   */
  static getFiscalYear(date: string | Date, fiscalYearStart = 1): number {
    const d = dayjs(date);
    if (d.month() + 1 >= fiscalYearStart) {
      return d.year();
    } else {
      return d.year() - 1;
    }
  }

  /**
   * Get quarter based on date
   */
  static getQuarter(date: string | Date): number {
    return dayjs(date).quarter();
  }

  /**
   * Check if date is a weekend
   */
  static isWeekend(date: string | Date): boolean {
    const dayOfWeek = dayjs(date).day();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  /**
   * Get next business day (skip weekends)
   */
  static getNextBusinessDay(date: string | Date): string {
    let nextDay = dayjs(date).add(1, 'day');
    
    while (this.isWeekend(nextDay.toISOString())) {
      nextDay = nextDay.add(1, 'day');
    }
    
    return nextDay.toISOString();
  }

  /**
   * Get previous business day (skip weekends)
   */
  static getPreviousBusinessDay(date: string | Date): string {
    let prevDay = dayjs(date).subtract(1, 'day');
    
    while (this.isWeekend(prevDay.toISOString())) {
      prevDay = prevDay.subtract(1, 'day');
    }
    
    return prevDay.toISOString();
  }

  /**
   * Format date for file name (safe, sortable)
   */
  static formatFileISOString(date: string | Date): string {
    return dayjs(date).format(DATE_FORMATS.FILE_NAME);
  }

  /**
   * Get Australian financial year (July 1 - June 30)
   * Returns the starting year of the financial year
   */
  static getAustralianFinancialYear(date?: string | Date): number {
    const d = date ? dayjs(date) : dayjs();
    const month = d.month() + 1; // dayjs months are 0-indexed
    
    if (month >= 7) {
      return d.year();
    } else {
      return d.year() - 1;
    }
  }

  /**
   * Get Australian financial year as string format (e.g., "2024-2025")
   */
  static getAustralianFinancialYearString(date?: string | Date): string {
    const startYear = this.getAustralianFinancialYear(date);
    return `${startYear}-${startYear + 1}`;
  }

  /**
   * Get Australian financial year date range
   */
  static getAustralianFinancialYearRange(date?: string | Date): {
    start: string;
    end: string;
  } {
    const startYear = this.getAustralianFinancialYear(date);
    
    return {
      start: dayjs(`${startYear}-07-01`).startOf('day').toISOString(),
      end: dayjs(`${startYear + 1}-06-30`).endOf('day').toISOString(),
    };
  }

  /**
   * Check if date is in current Australian financial year
   */
  static isCurrentAustralianFinancialYear(date: string | Date): boolean {
    const inputYear = this.getAustralianFinancialYear(date);
    const currentYear = this.getAustralianFinancialYear();
    return inputYear === currentYear;
  }
}

// Type for dayjs duration
export type Duration = ReturnType<typeof dayjs.duration>;

// Export dayjs instance for direct use if needed
export { dayjs };

// Common date format helpers
export const dateHelpers = {
  /**
   * Format date for form inputs (HTML input type="date")
   */
  forInput: (date: string | Date): string => dayjs(date).format(DATE_FORMATS.INPUT),
  /**
   * Format date for API (ISO string)
   */
  forApi: (date: string | Date): string => dayjs(date).toISOString(),
  /**
   * Format date for display in tables (Australian format)
   */
  forTable: (date: string | Date): string => dayjs(date).format(DATE_FORMATS.DISPLAY),
  /**
   * Format date for file names
   */
  forFileName: (date: string | Date): string => dayjs(date).format('YYYY-MM-DD_HH-mm-ss'),
  /**
   * Smart date formatting based on recency
   */
  smart: (date: string | Date): string => {
    const d = dayjs(date);
    if (d.isToday()) {
      return `Today at ${d.format('h:mm A')}`;
    } else if (d.isYesterday()) {
      return `Yesterday at ${d.format('h:mm A')}`;
    } else if (DateUtils.isThisWeek(date)) {
      return d.format('dddd [at] h:mm A');
    } else if (DateUtils.isThisYear(date)) {
      return d.format('D MMM [at] h:mm A');
    } else {
      return d.format(DATE_FORMATS.LONG + ' [at] h:mm A');
    }
  },
}; 