import { count, desc, sum } from "drizzle-orm";
import { invoices } from "@/schema/invoiceTables";
import { type InvoiceStats } from "@/schema/invoiceQueries";
import { db } from "@/lib/database";

/**
 * Generates comprehensive invoice statistics and analytics
 * Includes total amounts, counts, category breakdown, monthly trends, and top suppliers
 * @returns Invoice statistics data
 * @throws Error if database query fails
 */
export const getInvoiceStats = async (): Promise<InvoiceStats> => {
    const { totalAmount, totalCount } = await getTotalInvoiceStats();
    const categoryBreakdown = await getCategoryBreakdown();
    const monthlyTrend = await getMonthlyTrend();
    const topSuppliers = await getTopSuppliers();

    return {
        totalAmount,
        totalCount,
        categoryBreakdown,
        monthlyTrend,
        topSuppliers,
    };
};

/**
 * Get total invoice count and amount
 */
const getTotalInvoiceStats = async () => {
    const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(invoices);

    const totalAmountResult = await db
        .select({ sum: sum(invoices.totalAmount) })
        .from(invoices);
    const totalAmount = parseFloat(totalAmountResult[0]?.sum || "0");

    return { totalCount, totalAmount };
};

/**
 * Get category breakdown statistics
 */
const getCategoryBreakdown = async () => {
    const categoryStats = await db
        .select({
            category: invoices.category,
            count: count(),
            amount: sum(invoices.totalAmount),
        })
        .from(invoices)
        .groupBy(invoices.category);

    return categoryStats.reduce(
        (acc, stat) => {
            if (stat.category) {
                acc[stat.category] = {
                    count: stat.count,
                    amount: parseFloat(stat.amount || "0"),
                };
            }
            return acc;
        },
        {} as InvoiceStats["categoryBreakdown"],
    );
};

/**
 * Get monthly trend statistics
 */
const getMonthlyTrend = async () => {
    const monthlyStats = await db
        .select({
            month: invoices.invoiceDate,
            count: count(),
            amount: sum(invoices.totalAmount),
        })
        .from(invoices)
        .groupBy(invoices.invoiceDate)
        .orderBy(invoices.invoiceDate);

    return monthlyStats.map((stat) => ({
        month: stat.month?.toISOString().split("T")[0] || "",
        amount: parseFloat(stat.amount || "0"),
        count: stat.count,
    }));
};

/**
 * Get top 10 suppliers by invoice count
 */
const getTopSuppliers = async () => {
    const supplierStats = await db
        .select({
            name: invoices.supplierName,
            count: count(),
            amount: sum(invoices.totalAmount),
        })
        .from(invoices)
        .groupBy(invoices.supplierName)
        .orderBy(desc(count()))
        .limit(10);

    return supplierStats
        .filter((stat) => stat.name)
        .map((stat) => ({
            name: stat.name!,
            amount: parseFloat(stat.amount || "0"),
            count: stat.count,
        }));
};
