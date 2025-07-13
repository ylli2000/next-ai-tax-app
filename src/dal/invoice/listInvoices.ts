import { and, count, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import {
    type InvoiceListFilters,
    type InvoiceListSort,
    type InvoiceListResult,
} from "@/schema/invoiceQueries";
import { db } from "../db";

/**
 * Lists invoices with pagination, filtering, and sorting capabilities
 * Supports filtering by category, status, supplier, date range, amount range, and tags
 * @param filters - Optional filters for category, status, supplier, dates, amounts, and tags
 * @param sort - Sorting configuration with field and direction
 * @param page - Page number for pagination (1-based)
 * @param limit - Number of invoices per page
 * @returns Paginated invoice list with metadata
 */
export const listInvoices = async (
    filters: InvoiceListFilters = {},
    sort: InvoiceListSort = { field: "createdAt", direction: "desc" },
    page: number = 1,
    limit: number = 20,
): Promise<InvoiceListResult> => {
    const whereConditions = [];

    if (filters.category) {
        whereConditions.push(eq(invoices.category, filters.category));
    }
    if (filters.status) {
        whereConditions.push(eq(invoices.status, filters.status));
    }
    if (filters.supplierName) {
        whereConditions.push(
            ilike(invoices.supplierName, `%${filters.supplierName}%`),
        );
    }
    if (filters.dateFrom) {
        whereConditions.push(gte(invoices.invoiceDate, filters.dateFrom));
    }
    if (filters.dateTo) {
        whereConditions.push(lte(invoices.invoiceDate, filters.dateTo));
    }
    if (filters.amountMin) {
        whereConditions.push(
            gte(invoices.totalAmount, filters.amountMin.toString()),
        );
    }
    if (filters.amountMax) {
        whereConditions.push(
            lte(invoices.totalAmount, filters.amountMax.toString()),
        );
    }
    if (filters.description) {
        whereConditions.push(
            ilike(invoices.description, `%${filters.description}%`),
        );
    }

    const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(invoices)
        .where(whereClause);

    const offset = (page - 1) * limit;
    const hasMore = offset + limit < totalCount;

    // Build base query
    const baseQuery = db
        .select({
            invoice: invoices,
            file: invoiceFiles,
        })
        .from(invoices)
        .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset);

    // Apply sorting
    let result;
    switch (sort.field) {
        case "invoiceDate":
            result = await baseQuery.orderBy(
                sort.direction === "desc"
                    ? desc(invoices.invoiceDate)
                    : invoices.invoiceDate,
            );
            break;
        case "totalAmount":
            result = await baseQuery.orderBy(
                sort.direction === "desc"
                    ? desc(invoices.totalAmount)
                    : invoices.totalAmount,
            );
            break;
        case "supplierName":
            result = await baseQuery.orderBy(
                sort.direction === "desc"
                    ? desc(invoices.supplierName)
                    : invoices.supplierName,
            );
            break;
        case "updatedAt":
            result = await baseQuery.orderBy(
                sort.direction === "desc"
                    ? desc(invoices.updatedAt)
                    : invoices.updatedAt,
            );
            break;
        default:
            result = await baseQuery.orderBy(
                sort.direction === "desc"
                    ? desc(invoices.createdAt)
                    : invoices.createdAt,
            );
            break;
    }

    return {
        invoices: result,
        totalCount,
        hasMore,
    };
};
