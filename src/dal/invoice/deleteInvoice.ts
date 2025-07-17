import { eq } from "drizzle-orm";
import { invoices } from "@/schema/invoiceTables";
import { logInfo } from "@/utils/sys/log";
import { db } from "@/lib/database";

/**
 * Deletes an invoice and its associated file
 * Database constraints handle cascading deletion of associated files
 * @param id - Invoice ID to delete
 */
export const deleteInvoice = async (id: string): Promise<void> => {
    await db.delete(invoices).where(eq(invoices.id, id));

    logInfo(`Invoice deleted successfully`, { invoiceId: id });
};
