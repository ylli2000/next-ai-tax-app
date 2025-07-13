import { eq } from "drizzle-orm";
import { invoices } from "@/schema/invoiceTables";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Deletes an invoice and its associated file
 * Checks for invoice existence before deletion, cascades to file
 * @param id - Invoice ID to delete
 * @returns Success response or error if invoice not found
 */
export const deleteInvoice = async (id: string) => {
    try {
        const existingInvoice = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);
        if (existingInvoice.length === 0) {
            return {
                success: false,
                error: ERROR_MESSAGES.RECORD_NOT_FOUND,
                data: null,
            };
        }
        await db.delete(invoices).where(eq(invoices.id, id));
        logInfo(`Invoice deleted successfully`, { invoiceId: id });
        return {
            success: true,
            data: null,
            message: SUCCESS_MESSAGES.INVOICE_DELETED,
        };
    } catch (error) {
        logError("Failed to delete invoice", { error, invoiceId: id });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
