import { eq } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { type InvoiceStatus } from "@/schema/invoiceSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Retrieves all invoices with a specific status
 * Returns invoices with their files ordered by creation date
 * @param status - Invoice status to filter by (PENDING, PROCESSED, ERROR, etc.)
 * @returns Success response with invoices matching the status, or error response
 */
export const getInvoicesByStatus = async (status: InvoiceStatus) => {
    try {
        const result = await db
            .select({
                invoice: invoices,
                file: invoiceFiles,
            })
            .from(invoices)
            .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
            .where(eq(invoices.status, status))
            .orderBy(invoices.createdAt);
        return {
            success: true,
            data: result,
        };
    } catch (error) {
        logError("Failed to get invoices by status", { error, status });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
