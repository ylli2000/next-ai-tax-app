import { desc, eq } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Retrieves all invoices for a specific user
 * Returns user's invoices with their files ordered by creation date
 * @param userId - User ID to filter invoices by
 * @returns Success response with user's invoices, or error response
 */
export const getInvoicesByUserId = async (userId: string) => {
    try {
        const result = await db
            .select({
                invoice: invoices,
                file: invoiceFiles,
            })
            .from(invoices)
            .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
            .where(eq(invoices.userId, userId))
            .orderBy(desc(invoices.createdAt));
        return {
            success: true,
            data: result,
        };
    } catch (error) {
        logError("Failed to get invoices by user ID", { error, userId });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
