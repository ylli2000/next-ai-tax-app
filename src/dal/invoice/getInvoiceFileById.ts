import { eq } from "drizzle-orm";
import { invoiceFiles, type InvoiceFile } from "@/schema/invoiceTables";
import { db } from "../db";

/**
 * Retrieves an invoice file by its unique ID
 * @param id - Invoice file ID to search for
 * @returns Invoice file data, or null if not found
 */
export const getInvoiceFileById = async (
    id: string,
): Promise<InvoiceFile | null> => {
    const result = await db
        .select()
        .from(invoiceFiles)
        .where(eq(invoiceFiles.id, id))
        .limit(1);

    if (result.length === 0) {
        return null;
    }

    return result[0];
};
