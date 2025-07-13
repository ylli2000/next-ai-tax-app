import { z } from "zod";

// Export constants for exportUtils.ts
export const DISPLAY_MESSAGES = {
    YES: "Yes", // Used in exportUtils.ts for boolean true display
    NO: "No", // Used in exportUtils.ts for boolean false display
} as const;

export const AI_MESSAGES = {
    // Reasoning message templates
    SUPPLIER_BASED_REASONING:
        'Suggested "{baseName}" based on supplier name "{supplierName}".',
    DEFAULT_REASONING: 'Suggested "{baseName}" as default category.',
} as const;

export const AiMessageKeysEnum = Object.keys(AI_MESSAGES) as [
    keyof typeof AI_MESSAGES,
    ...Array<keyof typeof AI_MESSAGES>,
];
export const AiMessageKeysSchema = z.enum(AiMessageKeysEnum);
export type AiMessageKey = z.infer<typeof AiMessageKeysSchema>;

export const AIValidationErrorCodeEnum = [
    "MISSING_TOTAL",
    "MISSING_SUPPLIER",
    "CALCULATION_ERROR",
] as const;
export const AIValidationErrorCodeSchema = z.enum(AIValidationErrorCodeEnum);
export type AIValidationErrorCode = z.infer<typeof AIValidationErrorCodeSchema>;

// Success messages
export const SUCCESS_MESSAGES = {
    EMAIL_SENT: "Email sent successfully!",
    INVOICE_UPLOADED: "Invoice uploaded and processed successfully!",
    INVOICE_UPDATED: "Invoice updated successfully!",
    INVOICE_DELETED: "Invoice deleted successfully!",
    CATEGORY_CREATED: "Category created successfully!",
    CATEGORY_UPDATED: "Category updated successfully!",
    CATEGORY_DELETED: "Category deleted successfully!",
    EXPORT_COMPLETED: "Export completed successfully!",
    USER_CREATED_SUCCESSFULLY: "User created successfully!",
    USER_UPDATED_SUCCESSFULLY: "User updated successfully!",
    USER_DELETED_SUCCESSFULLY: "User deleted successfully!",
    USER_PROFILE_UPDATED_SUCCESSFULLY: "User profile updated successfully!",
} as const;

export const SuccessMessageKeysEnum = Object.keys(SUCCESS_MESSAGES) as [
    keyof typeof SUCCESS_MESSAGES,
    ...Array<keyof typeof SUCCESS_MESSAGES>,
];
export const SuccessMessageKeysSchema = z.enum(SuccessMessageKeysEnum);
export type SuccessMessageKey = z.infer<typeof SuccessMessageKeysSchema>;

// Error messages
export const ERROR_MESSAGES = {
    // File upload errors
    FILE_TOO_LARGE: "File size exceeds the maximum limit of 10MB",
    INVALID_FILE_TYPE:
        "Invalid file type. Only PDF, JPG, and PNG files are allowed",
    UPLOAD_FAILED:
        "Upload failed. Please check your internet connection and try again",

    // AI processing errors
    AI_PROCESSING_FAILED:
        "We couldn't read your invoice automatically. Please check if the image is clear and try again",
    INVALID_INVOICE_FORMAT:
        "This doesn't appear to be a valid invoice. Please upload a clear invoice image",
    EXTRACTION_FAILED:
        "We couldn't extract information from this invoice. Please ensure the image is clear and try again",
    OPENAI_MODEL_NOT_CONFIGURED: "OpenAI model is not configured",
    INVALID_MAX_TOKENS_CONFIG: "Invalid max tokens configuration",

    // Database errors
    DATABASE_ERROR:
        "Something went wrong while saving your data. Please try again",
    RECORD_NOT_FOUND: "The item you're looking for could not be found",
    DUPLICATE_RECORD: "This item already exists in your records",

    // User errors
    USER_CREATION_FAILED: "User creation failed",
    USER_UPDATE_FAILED: "User update failed",
    USER_DELETION_FAILED: "User deletion failed",
    USER_ALREADY_EXISTS: "User already exists",
    USER_PROFILE_NOT_FOUND: "User profile not found",
    USER_PROFILE_UPDATE_FAILED: "User profile update failed",

    // Authentication errors
    UNAUTHORIZED: "You don't have permission to do this action",
    SESSION_EXPIRED: "Your session has expired. Please sign in again",
    INVALID_CREDENTIALS: "Email or password is incorrect. Please try again",
    EMAIL_NOT_VERIFIED: "Please verify your email address before signing in",
    ACCOUNT_LOCKED:
        "Your account has been temporarily locked for security. Please try again in a few minutes",
    WEAK_PASSWORD:
        "Please choose a stronger password with at least 6 characters, including uppercase, lowercase, and numbers",
    USER_NOT_FOUND: "We couldn't find an account with that email address",
    TOKEN_EXPIRED: "Token has expired",
    INVALID_TOKEN: "Invalid or malformed token",
    PERMISSION_DENIED: "Sorry, you don't have access to this feature",
    AUTHENTICATION_FAILED:
        "Sign-in failed. Please check your details and try again",
    PASSWORD_DO_NOT_MATCH: "Passwords do not match",
    ACCEPT_TERMS: "You must accept the terms and conditions",
    FAILED_TO_HASH_PASSWORD: "Failed to hash password",
    FAILED_TO_CREATE_USER_PROFILE: "Failed to create user profile",

    // Validation errors
    VALIDATION_FAILED: "Please check the information you entered and try again",
    REQUIRED_FIELD: "This field is required",
    MISSING_TOTAL: "Please enter the total amount for this invoice",
    MISSING_SUPPLIER: "Please enter the supplier name",
    CALCULATION_ERROR:
        "The total amount doesn't match the subtotal plus tax. Please double-check your numbers",
    INVALID_NAME: "Name must be between 1 and 100 characters",
    INVALID_EMAIL: "Please enter a valid email address",
    INVALID_AMOUNT: "Please enter a valid amount",
    INVALID_DATE: "Please enter a valid date in DD/MM/YYYY format",
    INVALID_CURRENCY: "This currency is not supported. Please use AUD",
    INVALID_CATEGORY: "Please select a valid category",
    INVALID_UUID: "Invalid reference ID format",
    INVALID_URL: "Please enter a valid web address",
    INVALID_PHONE_NUMBER:
        "Please enter a valid phone number (numbers, spaces, dashes, and brackets are allowed)",
    INVALID_HEX_COLOR: "Please enter a valid color code (e.g., #FF0000)",
    INVALID_INVOICE_NUMBER:
        "Invoice number must be 2-30 characters and can only contain letters, numbers, dashes, and underscores",
    INVALID_TAX_RATE: "Tax rate must be between 0% and 100%",
    INVALID_TAX_ID: "Please enter a valid Australian tax ID (ABN or ACN)",
    INVALID_LINE_ITEM:
        "Line item description must be between 1 and 250 characters",
    INVALID_DESCRIPTION: "Description must be less than 500 characters",
    INVALID_OPENAI_FIELD_ID:
        "File processing error. Please try uploading your file again",
    // API errors
    RATE_LIMIT_EXCEEDED:
        "You're doing that too quickly. Please wait a moment and try again",
    INVALID_RESPONSE_FORMAT:
        "Something went wrong with the server response. Please try again",
    INVALID_AI_RESPONSE_FORMAT:
        "We couldn't process the invoice analysis. Please try again",
    FAILED_TO_PROCESS_AI_RESPONSE:
        "Invoice processing failed. Please try again with a clearer image",

    //Network errors
    SERVER_ERROR:
        "Something went wrong on our end. Please try again in a moment",
    NETWORK_ERROR:
        "Connection problem. Please check your internet and try again",

    // Upload errors
    NO_FILES_SELECTED: "No files selected",
    FILE_SELECTION_CANCELLED: "File selection cancelled",
    FILE_UPLOAD_FAILED: "File upload failed",
    FILE_UPLOAD_CANCELLED: "File upload cancelled",
    FILE_UPLOAD_TIMEOUT: "File upload timed out",
    FILE_UPLOAD_ABORTED: "File upload aborted",
    FAILED_TO_COMPRESS_IMAGE: "Failed to compress image",
    FAILED_TO_LOAD_IMAGE: "Failed to load image",

    // AWS S3 Storage errors
    AWS_CONFIGURATION_ERROR:
        "Cloud storage configuration error. Please contact support",
    S3_UPLOAD_FAILED:
        "Failed to upload file to cloud storage. Please try again",
    S3_DOWNLOAD_FAILED: "Failed to download file from cloud storage",
    S3_DELETE_FAILED: "Failed to delete file from cloud storage",
    S3_METADATA_FAILED: "Failed to get file information from cloud storage",

    // Export errors
    EXPORT_FAILED: "Export failed. Please try again",
    ERROR_READING_FILES: "Error reading files",
    NO_FIELDS_SELECTED: "No fields selected",
    INVALID_EXPORT_FORMAT: "Invalid export format",

    // Email errors
    EMAIL_SEND_FAILED: "Failed to send email. Please try again",
    INVALID_EMAIL_TEMPLATE: "Invalid email template",

    // Unknown errors
    UNKNOWN_ERROR: "An unknown error occurred",
} as const;

export const ErrorMessageKeysEnum = Object.keys(ERROR_MESSAGES) as [
    keyof typeof ERROR_MESSAGES,
    ...Array<keyof typeof ERROR_MESSAGES>,
];
export const ErrorMessageKeysSchema = z.enum(ErrorMessageKeysEnum);
export type ErrorMessageKey = z.infer<typeof ErrorMessageKeysSchema>;
//get the array of values from ERROR_MESSAGES
export const ErrorMessageValues = Object.values(ERROR_MESSAGES) as [
    (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES],
    ...(typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES][],
];
export const ErrorMessageValuesSchema = z.enum(ErrorMessageValues);
export type ErrorMessageValue = z.infer<typeof ErrorMessageValuesSchema>;
