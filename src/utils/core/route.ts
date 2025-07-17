import { z } from "zod";
import {
    PAGINATION_HEADERS,
    PROTECTED_ROUTES,
    PUBLIC_ROUTES,
} from "@/schema/routeSchema";

/**
 * Route utility functions for authentication and navigation
 *
 * Purpose: Handle page routing, authentication checks, and URL building (different from API paths)
 * Used by: Middleware, navigation components, page routing logic
 *
 * Key Difference from API paths:
 * - ROUTES = Page navigation paths (handled by Next.js App Router)
 * - API_PATHS = Server endpoint definitions (handled by API route handlers)
 *
 * Usage Examples:
 * ```typescript
 * // Route protection in middleware
 * if (isProtectedRoute(req.nextUrl.pathname)) {
 *   // Redirect to login
 * }
 *
 * // URL building for pages (not API calls)
 * const pageUrl = buildUrl('https://app.com', '/invoices', { page: 1 });
 * // → 'https://app.com/invoices?page=1'
 *
 * // Pagination header parsing from API responses
 * const paginationInfo = parsePaginationHeaders(response.headers);
 * router.push(`/invoices?page=${paginationInfo.page}`);
 * ```
 */

/**
 * Parse pagination metadata from HTTP response headers
 *
 * Why: Servers are stateless - they don't track which page you're on.
 * Headers provide pagination state separate from data payload.
 *
 * Usage: Extract server-side pagination info from API responses
 * ```typescript
 * const response = await fetch('/api/invoices');
 * const paginationInfo = parsePaginationHeaders(response.headers);
 * // Returns: { page: 1, limit: 20, total: 100, totalPages: 5 }
 * ```
 *
 * Page routing: Sync pagination with URL state
 * ```typescript
 * const paginationInfo = parsePaginationHeaders(response.headers);
 * router.push(`/invoices?page=${paginationInfo.page}&limit=${paginationInfo.limit}`);
 * ```
 *
 * Used by: Components, page routing, URL synchronization
 * Headers: x-page, x-limit, x-total, x-total-pages
 */
export const parsePaginationHeaders = (
    headers: Headers,
): {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
} => ({
    page: headers.get(PAGINATION_HEADERS.PAGE)
        ? Number(headers.get(PAGINATION_HEADERS.PAGE))
        : undefined,
    limit: headers.get(PAGINATION_HEADERS.LIMIT)
        ? Number(headers.get(PAGINATION_HEADERS.LIMIT))
        : undefined,
    total: headers.get(PAGINATION_HEADERS.TOTAL)
        ? Number(headers.get(PAGINATION_HEADERS.TOTAL))
        : undefined,
    totalPages: headers.get(PAGINATION_HEADERS.TOTAL_PAGES)
        ? Number(headers.get(PAGINATION_HEADERS.TOTAL_PAGES))
        : undefined,
});

/**
 * Build query string from object
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    searchParams.append(key, String(item));
                });
            } else {
                searchParams.append(key, String(value));
            }
        }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
};

/**
 * Combine base URL with path and query parameters
 */
export const buildUrl = (
    baseUrl: string,
    path: string,
    params?: Record<string, unknown>,
): string => {
    const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const queryString = params ? buildQueryString(params) : "";
    return url + queryString;
};

// Zod schemas for route validation and type safety
export const protectedRouteSchema = z.enum(PROTECTED_ROUTES);
export const publicRouteSchema = z.enum(PUBLIC_ROUTES);

// Type exports for TypeScript usage
export type ProtectedRoute = z.infer<typeof protectedRouteSchema>;
export type PublicRoute = z.infer<typeof publicRouteSchema>;

// Helper functions for route checking with type safety
export const RouteUtils = {
    /**
     * Check if a path starts with any protected route
     * Used in middleware.ts for authentication validation
     */
    isProtectedRoute: (pathname: string): boolean =>
        PROTECTED_ROUTES.some((route) => pathname.startsWith(route)),

    /**
     * Check if a path starts with any public route
     * Used in middleware.ts for public access validation
     */
    isPublicRoute: (pathname: string): boolean =>
        PUBLIC_ROUTES.some((route) => pathname.startsWith(route)),

    /**
     * Validate if a route is a valid protected route
     * Used for runtime validation and type checking
     */
    validateProtectedRoute: (route: string): route is ProtectedRoute =>
        protectedRouteSchema.safeParse(route).success,

    /**
     * Validate if a route is a valid public route
     * Used for runtime validation and type checking
     */
    validatePublicRoute: (route: string): route is PublicRoute =>
        publicRouteSchema.safeParse(route).success,
} as const;

// Direct export of utility functions for cleaner imports
/**
 * Check if a path starts with any protected route
 * Used in middleware.ts for authentication validation
 */
export const isProtectedRoute = (pathname: string): boolean =>
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

/**
 * Check if a path starts with any public route
 * Used in middleware.ts for public access validation
 */
export const isPublicRoute = (pathname: string): boolean =>
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

/**
 * Validate if a route is a valid protected route
 * Used for runtime validation and type checking
 */
export const validateProtectedRoute = (
    route: string,
): route is ProtectedRoute => protectedRouteSchema.safeParse(route).success;

/**
 * Validate if a route is a valid public route
 * Used for runtime validation and type checking
 */
export const validatePublicRoute = (route: string): route is PublicRoute =>
    publicRouteSchema.safeParse(route).success;
