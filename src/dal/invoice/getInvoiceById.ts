import { eq } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Retrieves an invoice by its unique ID along with file information
 * @param id - Invoice ID to search for
 * @returns Success response with invoice and file data, or error if not found
 */
export const getInvoiceById = async (id: string) => {
    try {
        const result = await db
            .select({
                invoice: invoices,
                file: invoiceFiles,
            })
            .from(invoices)
            .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
            .where(eq(invoices.id, id))
            .limit(1);
        if (result.length === 0) {
            return {
                success: false,
                error: ERROR_MESSAGES.RECORD_NOT_FOUND,
                data: null,
            };
        }
        const [{ invoice, file }] = result;
        return {
            success: true,
            data: { invoice, file },
        };
    } catch (error) {
        logError("Failed to get invoice by ID", { error, invoiceId: id });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
