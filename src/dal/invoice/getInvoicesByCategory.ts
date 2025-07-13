import { desc, eq } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { type InvoiceCategory } from "@/schema/invoiceSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Retrieves all invoices in a specific category
 * Returns invoices with their files ordered by invoice date
 * @param category - Invoice category to filter by
 * @returns Success response with invoices matching the category, or error response
 */
export const getInvoicesByCategory = async (category: InvoiceCategory) => {
    try {
        const result = await db
            .select({
                invoice: invoices,
                file: invoiceFiles,
            })
            .from(invoices)
            .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
            .where(eq(invoices.category, category))
            .orderBy(desc(invoices.invoiceDate));
        return {
            success: true,
            data: result,
        };
    } catch (error) {
        logError("Failed to get invoices by category", { error, category });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
