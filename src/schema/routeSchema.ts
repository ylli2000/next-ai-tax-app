import { z } from "zod";
import { sortOrderSchema } from "./commonSchemas";

// Type exports for TypeScript usage
export const ROUTE_CONSTANTS = {
    DEFAULT_PAGINATION_SIZE: "50" as PaginationSizeOptions, // Used in pagination initialization
} as const;

// Pagination Size Options enum
export const PaginationSizeOptionsEnum = ["10", "20", "50", "100"] as const;
export const paginationSizeOptionsSchema = z.enum(PaginationSizeOptionsEnum);
export type PaginationSizeOptions = z.infer<typeof paginationSizeOptionsSchema>;

/**
 * App Routes - Client-side page navigation paths
 *
 * Purpose: Define base page paths for Next.js App Router navigation
 * Used by: Navigation components, middleware, redirects, router.push()
 *
 * Design: Static base paths only - Next.js handles dynamic segments via file system
 * (e.g., /invoices/[id]/page.tsx automatically handles /invoices/123)
 *
 * Usage Examples:
 * ```typescript
 * // Page navigation
 * router.push(ROUTES.INVOICES)                    // → '/invoices' (list page)
 * router.push(`${ROUTES.INVOICES}/${invoiceId}`)  // → '/invoices/123' (detail page)
 *
 * // Middleware route protection
 * if (PROTECTED_ROUTES.includes(pathname)) { ... }
 *
 * // Navigation components
 * <Link href={ROUTES.DASHBOARD}>Dashboard</Link>
 * ```
 *
 * Note: No BY_ID functions needed - Next.js [id] dynamic routes handle parameters
 */
export const ROUTES = {
    HOME: "/", // Used in navigation components and redirects
    DASHBOARD: "/dashboard", // Used in navigation and dashboard page routing
    INVOICES: "/invoices", // Used in invoice list navigation and links
    UPLOAD: "/upload", // Used in file upload navigation and form actions
    SETTINGS: "/settings", // Used in user settings navigation
    PROFILE: "/profile", // Used in user profile navigation
    ANALYTICS: "/analytics", // Used in analytics page navigation (from PRD requirements)
    AUTH: {
        SIGNIN: "/auth/signin", // Used in authentication redirects and login forms
        SIGNUP: "/auth/signup", // Used in registration forms and auth navigation
        SIGNOUT: "/auth/signout", // Used in logout actions and auth middleware
        ERROR: "/auth/error", // Used in NextAuth error handling
        VERIFY_EMAIL: "/auth/verify-email", // Used in email verification
        RESET_PASSWORD: "/auth/reset-password", // Used in password reset
    },
    API: {
        AUTH: "/api/auth", // Used in NextAuth API routes
        UPLOAD: "/api/upload", // Used in file upload form actions and API calls
        INVOICES: "/api/invoices", // Used in invoice CRUD operations and data fetching
        AI_EXTRACT: "/api/ai/extract", // Used in AI processing API calls
        EXPORT: "/api/export", // Used in data export functionality
    },
} as const;

// Authentication Route Constants - Used in middleware for route protection and navigation
// Extracted from ROUTES for better organization and type safety
export const PROTECTED_ROUTES = [
    ROUTES.DASHBOARD,
    ROUTES.INVOICES,
    ROUTES.UPLOAD,
    ROUTES.SETTINGS,
    ROUTES.ANALYTICS,
    ROUTES.PROFILE,
] as const;
export const protectedRouteSchema = z.enum(PROTECTED_ROUTES);
export type ProtectedRoute = z.infer<typeof protectedRouteSchema>;

export const PUBLIC_ROUTES = [
    ROUTES.HOME,
    ROUTES.AUTH.SIGNIN,
    ROUTES.AUTH.SIGNUP,
    ROUTES.AUTH.ERROR,
    ROUTES.AUTH.VERIFY_EMAIL,
    ROUTES.AUTH.RESET_PASSWORD,
    ROUTES.API.AUTH,
] as const;
export const publicRouteSchema = z.enum(PUBLIC_ROUTES);
export type PublicRoute = z.infer<typeof publicRouteSchema>;

// Pagination header names
export const PAGINATION_HEADERS = {
    PAGE: "x-page", // Used in apiUtils.ts for page number header
    LIMIT: "x-limit", // Used in apiUtils.ts for page limit header
    TOTAL: "x-total", // Used in apiUtils.ts for total records header
    TOTAL_PAGES: "x-total-pages", // Used in apiUtils.ts for total pages header
} as const;

// Paginated Response Schema
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
    itemSchema: T,
) =>
    z.object({
        data: z.array(itemSchema),
        pagination: paginationSchema,
    });
export type PaginatedResponse<T extends z.ZodTypeAny> = z.infer<
    ReturnType<typeof createPaginatedResponseSchema<T>>
>;

// Pagination Schema
export const paginationSchema = z.object({
    page: z.number().min(1),
    limit: z
        .number()
        .min(1)
        .max(
            Number(
                PaginationSizeOptionsEnum[PaginationSizeOptionsEnum.length - 1],
            ),
        ),
    total: z.number().min(0),
    totalPages: z.number().min(0),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
});
export type Pagination = z.infer<typeof paginationSchema>;

// Pagination Params Schema
export const paginationParamsSchema = z.object({
    page: z.number().min(1).optional().default(1),
    limit: z
        .number()
        .min(1)
        .max(
            Number(
                PaginationSizeOptionsEnum[PaginationSizeOptionsEnum.length - 1],
            ),
        )
        .optional()
        .default(Number(ROUTE_CONSTANTS.DEFAULT_PAGINATION_SIZE)),
    sortBy: z.string().optional(),
    sortOrder: sortOrderSchema.optional().default("asc"),
});
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
