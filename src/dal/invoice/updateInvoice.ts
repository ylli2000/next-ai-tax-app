import { eq } from "drizzle-orm";
import { invoices, type Invoice } from "@/schema/invoiceTables";
import { type UpdateInvoiceData } from "@/schema/invoiceQueries";
import { logInfo } from "@/utils/sys/log";
import { db } from "@/lib/database";

/**
 * Updates invoice information
 * Automatically updates the updatedAt timestamp
 * @param id - Invoice ID to update
 * @param updateData - Data to update (financial info, supplier details, etc.)
 * @returns Updated invoice data
 */
export const updateInvoice = async (
    id: string,
    updateData: UpdateInvoiceData,
): Promise<Invoice> => {
    const [updatedInvoice] = await db
        .update(invoices)
        .set({
            ...updateData,
            updatedAt: new Date(),
        })
        .where(eq(invoices.id, id))
        .returning();

    logInfo(`Invoice updated successfully`, {
        invoiceId: id,
        updatedFields: Object.keys(updateData),
    });

    return updatedInvoice;
};
