import { eq } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { type InvoiceStatus } from "@/schema/invoiceSchema";
import { type InvoiceWithFile } from "@/schema/invoiceQueries";
import { db } from "@/lib/database";

/**
 * Retrieves all invoices with a specific status
 * Returns invoices with their files ordered by creation date
 * @param status - Invoice status to filter by (PENDING, PROCESSED, ERROR, etc.)
 * @returns Array of invoices with file data matching the status
 */
export const getInvoicesByStatus = async (
    status: InvoiceStatus,
): Promise<InvoiceWithFile[]> => {
    const result = await db
        .select({
            invoice: invoices,
            file: invoiceFiles,
        })
        .from(invoices)
        .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
        .where(eq(invoices.status, status))
        .orderBy(invoices.createdAt);

    return result;
};
