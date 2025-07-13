import { invoices } from "@/schema/invoiceTables";
import {
    type CreateInvoiceData,
    createInvoiceDataSchema,
} from "@/schema/invoiceQueries";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Creates a new invoice record in the database
 * Links invoice to user and optionally to an uploaded file
 * @param invoiceData - Invoice creation data containing userId and fileId
 * @returns Success response with created invoice data, or error response
 */
export const createInvoice = async (invoiceData: CreateInvoiceData) => {
    try {
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
        return {
            success: true,
            message: SUCCESS_MESSAGES.INVOICE_UPLOADED,
            data: newInvoice,
        };
    } catch (error) {
        logError("Failed to create invoice", { error, invoiceData });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
