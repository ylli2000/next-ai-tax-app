import { and, count, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import {
    type InvoiceListFilters,
    type InvoiceListSort,
    invoiceListFiltersSchema,
    invoiceListSortSchema,
} from "@/schema/invoiceQueries";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Lists invoices with pagination, filtering, and sorting capabilities
 * Supports filtering by category, status, supplier, date range, amount range, and tags
 * @param filters - Optional filters for category, status, supplier, dates, amounts, and tags
 * @param sort - Sorting configuration with field and direction
 * @param page - Page number for pagination (1-based)
 * @param limit - Number of invoices per page
 * @returns Success response with paginated invoice list and metadata, or error response
 */
export const listInvoices = async (
    filters: InvoiceListFilters = {},
    sort: InvoiceListSort = { field: "createdAt", direction: "desc" },
    page: number = 1,
    limit: number = 20,
) => {
    try {
        const validatedFilters = invoiceListFiltersSchema.parse(filters);
        const validatedSort = invoiceListSortSchema.parse(sort);
        const whereConditions = [];
        if (validatedFilters.category) {
            whereConditions.push(
                eq(invoices.category, validatedFilters.category),
            );
        }
        if (validatedFilters.status) {
            whereConditions.push(eq(invoices.status, validatedFilters.status));
        }
        if (validatedFilters.supplierName) {
            whereConditions.push(
                ilike(
                    invoices.supplierName,
                    `%${validatedFilters.supplierName}%`,
                ),
            );
        }
        if (validatedFilters.dateFrom) {
            whereConditions.push(
                gte(invoices.invoiceDate, validatedFilters.dateFrom),
            );
        }
        if (validatedFilters.dateTo) {
            whereConditions.push(
                lte(invoices.invoiceDate, validatedFilters.dateTo),
            );
        }
        if (validatedFilters.amountMin) {
            whereConditions.push(
                gte(
                    invoices.totalAmount,
                    validatedFilters.amountMin.toString(),
                ),
            );
        }
        if (validatedFilters.amountMax) {
            whereConditions.push(
                lte(
                    invoices.totalAmount,
                    validatedFilters.amountMax.toString(),
                ),
            );
        }
        if (validatedFilters.description) {
            whereConditions.push(
                ilike(
                    invoices.description,
                    `%${validatedFilters.description}%`,
                ),
            );
        }
        const whereClause =
            whereConditions.length > 0 ? and(...whereConditions) : undefined;
        const [{ count: total }] = await db
            .select({ count: count() })
            .from(invoices)
            .where(whereClause);
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);
        let result;
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
        switch (validatedSort.field) {
            case "invoiceDate":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(invoices.invoiceDate)
                        : invoices.invoiceDate,
                );
                break;
            case "totalAmount":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(invoices.totalAmount)
                        : invoices.totalAmount,
                );
                break;
            case "supplierName":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(invoices.supplierName)
                        : invoices.supplierName,
                );
                break;
            case "updatedAt":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(invoices.updatedAt)
                        : invoices.updatedAt,
                );
                break;
            default:
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(invoices.createdAt)
                        : invoices.createdAt,
                );
                break;
        }
        return {
            success: true,
            data: {
                invoices: result,
                total,
                page,
                limit,
                totalPages,
            },
        };
    } catch (error) {
        logError("Failed to list invoices", {
            error,
            filters,
            sort,
            page,
            limit,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
