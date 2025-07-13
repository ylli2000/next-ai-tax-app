import { count, sum, avg, desc } from "drizzle-orm";
import { invoices } from "@/schema/invoiceTables";
import {
    INVOICE_CATEGORIES,
    type InvoiceCategory,
} from "@/schema/invoiceSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

// Type definitions for category statistics
type RawCategoryStats = {
    category: InvoiceCategory | null;
    count: number;
    totalAmount: string | null; // Drizzle returns sum/avg as strings
    averageAmount: string | null;
};

type EnrichedCategoryStats = {
    name: string;
    description: string;
    color: string;
    keywords: readonly string[];
    count: number;
    totalAmount: number; // Converted to number
    averageAmount: number;
    percentage: number;
};

type CategoryTotals = {
    totalInvoices: number;
    totalAmount: number;
};

type CategoryStatsResponse =
    | {
          success: true;
          data: {
              categories: EnrichedCategoryStats[];
              totalCategories: number;
              totalInvoices: number;
              totalAmount: number;
          };
      }
    | {
          success: false;
          error: string;
          data: null;
      };

/**
 * Gets comprehensive category statistics with detailed breakdown
 * Includes count, total amount, average amount, and category metadata
 * @returns Success response with detailed category statistics, or error response
 */
export const getCategoryStats = async (): Promise<CategoryStatsResponse> => {
    try {
        const rawCategoryStats = await getCategoryRawStats();
        const enrichedStats = enrichCategoryData(rawCategoryStats);
        const statsWithPercentage = calculateCategoryPercentages(enrichedStats);
        const totals = calculateCategoryTotals(statsWithPercentage);

        return {
            success: true,
            data: {
                categories: statsWithPercentage,
                totalCategories: statsWithPercentage.length,
                totalInvoices: totals.totalInvoices,
                totalAmount: totals.totalAmount,
            },
        };
    } catch (error) {
        logError("Failed to get category statistics", { error });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};

/**
 * Get raw category statistics from database
 */
const getCategoryRawStats = async (): Promise<RawCategoryStats[]> =>
    await db
        .select({
            category: invoices.category,
            count: count(),
            totalAmount: sum(invoices.totalAmount),
            averageAmount: avg(invoices.totalAmount),
        })
        .from(invoices)
        .groupBy(invoices.category)
        .orderBy(desc(count()));

/**
 * Enrich category data with metadata from INVOICE_CATEGORIES
 */
const enrichCategoryData = (
    categoryStats: RawCategoryStats[],
): EnrichedCategoryStats[] =>
    categoryStats
        .filter(
            (stat): stat is RawCategoryStats & { category: InvoiceCategory } =>
                stat.category !== null,
        )
        .map((stat) => {
            const categoryInfo = INVOICE_CATEGORIES[stat.category];
            return {
                ...(categoryInfo || INVOICE_CATEGORIES.OTHER),
                count: stat.count,
                totalAmount: parseFloat(stat.totalAmount || "0"),
                averageAmount: parseFloat(stat.averageAmount || "0"),
                percentage: 0,
            };
        });

/**
 * Calculate percentage for each category based on total count
 */
const calculateCategoryPercentages = (
    enrichedStats: EnrichedCategoryStats[],
): EnrichedCategoryStats[] => {
    const totalCount = enrichedStats.reduce((sum, stat) => sum + stat.count, 0);
    return enrichedStats.map((stat) => ({
        ...stat,
        percentage: totalCount > 0 ? (stat.count / totalCount) * 100 : 0,
    }));
};

/**
 * Calculate total statistics for summary
 */
const calculateCategoryTotals = (
    statsWithPercentage: EnrichedCategoryStats[],
): CategoryTotals => ({
    totalInvoices: statsWithPercentage.reduce(
        (sum, stat) => sum + stat.count,
        0,
    ),
    totalAmount: statsWithPercentage.reduce(
        (sum, stat) => sum + stat.totalAmount,
        0,
    ),
});
