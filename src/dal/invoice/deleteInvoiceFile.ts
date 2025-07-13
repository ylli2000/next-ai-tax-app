import { eq } from "drizzle-orm";
import { invoiceFiles } from "@/schema/invoiceTables";
import { logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Deletes an invoice file record from the database
 * Note: This only removes the database record, not the actual file from storage
 * @param id - Invoice file ID to delete
 */
export const deleteInvoiceFile = async (id: string): Promise<void> => {
    await db.delete(invoiceFiles).where(eq(invoiceFiles.id, id));

    logInfo(`Invoice file deleted successfully`, { fileId: id });
};
