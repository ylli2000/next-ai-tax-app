import { invoices, type Invoice } from "@/schema/invoiceTables";
import {
    type CreateInvoiceData,
    insertInvoiceSchema,
} from "@/schema/invoiceQueries";
import { logInfo } from "@/utils/sys/log";
import { db } from "@/lib/database";

/**
 * Creates a new invoice record in the database
 * Links invoice to user and optionally to an uploaded file
 * @param invoiceData - Invoice creation data containing userId and fileId
 * @returns Created invoice data
 * @throws Error if validation fails or database query fails
 */
export const createInvoice = async (
    invoiceData: CreateInvoiceData,
): Promise<Invoice> => {
    const validatedData = insertInvoiceSchema.parse(invoiceData);

    const [newInvoice] = await db
        .insert(invoices)
        .values(validatedData)
        .returning();

    logInfo(`Invoice created successfully`, {
        invoiceId: newInvoice.id,
        userId: validatedData.userId,
    });

    return newInvoice;
};
