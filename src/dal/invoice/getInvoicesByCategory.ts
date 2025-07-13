import { desc, eq } from "drizzle-orm";
import { invoices, invoiceFiles } from "@/schema/invoiceTables";
import { type InvoiceCategory } from "@/schema/invoiceSchema";
import { type InvoiceWithFile } from "@/schema/invoiceQueries";
import { db } from "../db";

/**
 * Retrieves all invoices in a specific category
 * Returns invoices with their files ordered by invoice date
 * @param category - Invoice category to filter by
 * @returns Array of invoices with file data matching the category
 */
export const getInvoicesByCategory = async (
    category: InvoiceCategory,
): Promise<InvoiceWithFile[]> => {
    const result = await db
        .select({
            invoice: invoices,
            file: invoiceFiles,
        })
        .from(invoices)
        .leftJoin(invoiceFiles, eq(invoices.fileId, invoiceFiles.id))
        .where(eq(invoices.category, category))
        .orderBy(desc(invoices.invoiceDate));

    return result;
};
