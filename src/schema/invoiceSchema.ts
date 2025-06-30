import { categories, invoiceFiles, invoices } from "./invoiceTables";

export type UploadStatus = NonNullable<typeof invoiceFiles.$inferSelect.uploadStatus>;
export type InvoiceStatus = NonNullable<typeof invoices.$inferSelect.status>;
export type ValidationStatus = NonNullable<typeof invoices.$inferSelect.validationStatus>;
export type InvoiceCategory = NonNullable<typeof invoices.$inferSelect.category>;
export type InvoiceFile = typeof invoiceFiles.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Category = typeof categories.$inferSelect;