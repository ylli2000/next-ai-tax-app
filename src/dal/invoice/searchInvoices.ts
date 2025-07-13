import { eq, ilike, or } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Searches invoices by supplier name, invoice number, or description
 * Performs case-insensitive partial matching across multiple fields
 * @param query - Search term to match against supplier, number, or description
 * @param limit - Maximum number of results to return
 * @returns Success response with matching invoices, or error response
 */
export const searchInvoices = async (query: string, limit: number = 10) => {
    try {
        const result = await db
            .select({
                invoice: invoices,
                file: invoiceFiles,
            })
            .from(invoices)
            .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
            .where(
                or(
                    ilike(invoices.supplierName, `%${query}%`),
                    ilike(invoices.invoiceNumber, `%${query}%`),
                    ilike(invoices.description, `%${query}%`),
                ),
            )
            .limit(limit);
        return {
            success: true,
            data: result,
        };
    } catch (error) {
        logError("Failed to search invoices", { error, query, limit });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
