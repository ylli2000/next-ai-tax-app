import { invoices, type Invoice } from "@/schema/invoiceTables";
import {
    type CreateInvoiceData,
    createInvoiceDataSchema,
} from "@/schema/invoiceQueries";
import { logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Creates a new invoice record in the database
 * Links invoice to user and optionally to an uploaded file
 * @param invoiceData - Invoice creation data containing userId and fileId
 * @returns Created invoice data
 * @throws Error if validation fails or database query fails
 */
export const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
    const validatedData = createInvoiceDataSchema.parse(invoiceData);
    
    const [newInvoice] = await db
        .insert(invoices)
        .values({
            userId: validatedData.userId,
            fileId: validatedData.fileId,
            status: validatedData.status || "PENDING",
        })
        .returning();
        
    logInfo(`Invoice created successfully`, {
        invoiceId: newInvoice.id,
        userId: validatedData.userId,
    });
    
    return newInvoice;
};
