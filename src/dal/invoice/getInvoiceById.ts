import { eq } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { type InvoiceWithFile } from "@/schema/invoiceQueries";
import { db } from "@/lib/database";

/**
 * Retrieves an invoice by its unique ID along with file information
 * @param id - Invoice ID to search for
 * @returns Invoice with file data
 * @throws Error if invoice not found or database query fails
 */
export const getInvoiceById = async (id: string): Promise<InvoiceWithFile> => {
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
        throw new Error(`Invoice with ID ${id} not found`);
    }
    const [{ invoice, file }] = result;
    return { invoice, file };
};
