import { desc, eq } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { type InvoiceWithFile } from "@/schema/invoiceQueries";
import { db } from "../db";

/**
 * Retrieves all invoices for a specific user
 * Returns user's invoices with their files ordered by creation date
 * @param userId - User ID to filter invoices by
 * @returns Array of invoices with file data
 */
export const getInvoicesByUserId = async (
    userId: string,
): Promise<InvoiceWithFile[]> => {
    const result = await db
        .select({
            invoice: invoices,
            file: invoiceFiles,
        })
        .from(invoices)
        .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
        .where(eq(invoices.userId, userId))
        .orderBy(desc(invoices.createdAt));

    return result;
};
