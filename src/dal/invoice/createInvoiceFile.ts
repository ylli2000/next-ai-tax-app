import { invoiceFiles, type InvoiceFile } from "@/schema/invoiceTables";
import { insertInvoiceFileSchema } from "@/schema/invoiceQueries";
import { logInfo } from "@/utils/sys/log";
import { db } from "@/lib/database";

/**
 * Creates a new invoice file record in the database
 * Links file metadata to uploaded invoice files
 * @param fileData - Invoice file creation data containing file metadata
 * @returns Created invoice file data
 */
export const createInvoiceFile = async (fileData: {
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3ObjectKey: string;
}): Promise<InvoiceFile> => {
    const validatedData = insertInvoiceFileSchema.parse(fileData);

    const [newInvoiceFile] = await db
        .insert(invoiceFiles)
        .values(validatedData)
        .returning();

    logInfo(`Invoice file created successfully`, {
        fileId: newInvoiceFile.id,
        originalName: newInvoiceFile.originalName,
        fileSize: newInvoiceFile.fileSize,
    });

    return newInvoiceFile;
};
