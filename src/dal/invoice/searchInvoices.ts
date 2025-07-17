import { eq, ilike, or } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { type InvoiceWithFile } from "@/schema/invoiceQueries";
import { INVOICE_CONSTANTS } from "@/schema/invoiceSchema";
import { db } from "@/lib/database";

/**
 * Searches invoices by supplier name, invoice number, or description
 * Performs case-insensitive partial matching across multiple fields
 * @param query - Search term to match against supplier, number, or description
 * @param limit - Maximum number of results to return
 * @returns Array of matching invoices with file data
 */
export const searchInvoices = async (
    query: string,
    limit: number = INVOICE_CONSTANTS.DEFAULT_ITEMS_PER_PAGE,
): Promise<InvoiceWithFile[]> => {
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

    return result;
};
