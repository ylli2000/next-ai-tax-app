import { eq } from "drizzle-orm";
import { invoices } from "@/schema/invoiceTables";
import {
    type UpdateInvoiceData,
    updateInvoiceDataSchema,
} from "@/schema/invoiceQueries";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Updates invoice information
 * Validates input data and automatically updates the updatedAt timestamp
 * @param id - Invoice ID to update
 * @param updateData - Data to update (financial info, supplier details, etc.)
 * @returns Success response with updated invoice data, or error response
 */
export const updateInvoice = async (
    id: string,
    updateData: UpdateInvoiceData,
) => {
    try {
        const validatedData = updateInvoiceDataSchema.parse(updateData);
        const [updatedInvoice] = await db
            .update(invoices)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(invoices.id, id))
            .returning();
        if (!updatedInvoice) {
            return {
                success: false,
                error: ERROR_MESSAGES.RECORD_NOT_FOUND,
                data: null,
            };
        }
        logInfo(`Invoice updated successfully`, {
            invoiceId: id,
            updatedFields: Object.keys(validatedData),
        });
        return {
            success: true,
            data: updatedInvoice,
            message: SUCCESS_MESSAGES.INVOICE_UPDATED,
        };
    } catch (error) {
        logError("Failed to update invoice", {
            error,
            invoiceId: id,
            updateData,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
