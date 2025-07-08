import { z } from "zod";
import dayjs from "dayjs";
import { ERROR_MESSAGES } from "./messageSchema";

/**
 * Date-related schemas and enums using Zod
 * Contains date format constants and validation schemas
 */

// System Date format enums
export const DateFormatEnum = [
    "DD/MM/YYYY", // For display in UI， AI Prompt for invoice parsing also use this format (dayjs)
    "YYYY-MM-DD", // For HTML <input type="date"> value format (dayjs)
    "YYYY-MM-DDTHH:mm:ss.SSS[Z]", // For ISO string (dayjs)
    "D MMMM YYYY", // For long display, e.g. 5 June 2024 (dayjs)
    "YYYY-MM-DD_HH-mm-ss-SSS", // For file name safe date string (dayjs)
    "DD/MM/YYYY [at] h:mm A", // Used in dateUtils.ts for date time display
] as const;
export const dateFormatSchema = z.enum(DateFormatEnum);
export type DateFormat = z.infer<typeof dateFormatSchema>;

// Date Format Constants - referencing dateSchema enums for consistency
export const DATE_FORMATS = {
    DISPLAY: "DD/MM/YYYY" as DateFormat, // For display in UI (dayjs) - matches DateFormatEnum[0]
    INPUT: "YYYY-MM-DD" as DateFormat, // For HTML <input type="date"> value format (dayjs) - matches DateFormatEnum[1]
    ISO: "YYYY-MM-DDTHH:mm:ss.SSS[Z]" as DateFormat, // For ISO string (dayjs) - matches DateFormatEnum[2]
    SHORT: "DD/MM/YYYY" as DateFormat, // For short display/table (dayjs) - matches DateFormatEnum[0]
    LONG: "D MMMM YYYY" as DateFormat, // For long display, e.g. 5 June 2024 (dayjs) - matches DateFormatEnum[3]
    FILE_NAME: "YYYY-MM-DD_HH-mm-ss-SSS" as DateFormat, // For file name safe date string (dayjs) - matches DateFormatEnum[4]
    DISPLAY_WITH_TIME: "DD/MM/YYYY [at] h:mm A" as DateFormat, // Used in dateUtils.ts for date time display - matches DateFormatEnum[5]
    TODAY_AT_TIME: "Today at {time}" as DateFormat, // Used in dateUtils.ts for date time display - matches DateFormatEnum[6]
    YESTERDAY_AT_TIME: "Yesterday at {time}" as DateFormat, // Used in dateUtils.ts for date time display - matches DateFormatEnum[7]
    DAY_AT_TIME: "dddd [at] h:mm A" as DateFormat, // Used in dateUtils.ts for date time display - matches DateFormatEnum[8]
    MONTH_AT_TIME: "D MMM [at] h:mm A" as DateFormat, // Used in dateUtils.ts for date time display - matches DateFormatEnum[9]
    LONG_AT_TIME: "D MMMM YYYY [at] h:mm A" as DateFormat, // Used in dateUtils.ts for date time display - matches DateFormatEnum[10]
} as const;

// Date Range Constants
export const DateRangeEnum = [
    "today",
    "yesterday",
    "thisWeek",
    "lastWeek",
    "thisMonth",
    "lastMonth",
    "thisYear",
    "lastYear",
] as const;
export const dateRangeSchema = z.enum(DateRangeEnum);
export type DateRange = z.infer<typeof dateRangeSchema>;

export const validateDateFormatSchema = z.string().refine(
    (dateString) => {
        for (const format of DateFormatEnum) {
            const d = dayjs(dateString, format, true);
            if (d.isValid() && d.format(format) === dateString) {
                return true;
            }
        }
        return false;
    },
    {
        message: ERROR_MESSAGES.INVALID_DATE,
    },
);
