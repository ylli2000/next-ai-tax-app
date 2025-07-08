import { API_PATHS } from "@/schema/apiSchema";
import { buildUrl } from "./routeUtils";

/**
 * ApiEndpoints - Client-side API call encapsulation with URL building
 *
 * Purpose: Provide type-safe, intelligent API endpoint generation for client-side calls
 * Used by: Actions, hooks, components making API requests
 *
 * Design: Class-based approach with categorized methods for different resource types
 * Automatically handles baseUrl combination, query parameters, and path building
 *
 * Usage Examples:
 * ```typescript
 * // Initialize with base URL
 * const api = new ApiEndpoints('https://api.example.com');
 *
 * // Invoice operations
 * api.invoices.list({ page: 1, limit: 20 })    // → 'https://api.example.com/api/invoices?page=1&limit=20'
 * api.invoices.get('invoice-123')               // → 'https://api.example.com/api/invoices/invoice-123'
 * api.invoices.create()                         // → 'https://api.example.com/api/invoices'
 *
 * // Category operations
 * api.categories.update('cat-456')              // → 'https://api.example.com/api/categories/cat-456'
 * api.categories.list({ sort: 'name' })         // → 'https://api.example.com/api/categories?sort=name'
 *
 * // In Actions or hooks
 * const response = await fetch(api.invoices.get(id), { method: 'GET' });
 * ```
 *
 * Benefits: Type safety, intelligent completion, consistent URL generation, query param handling
 */
export class ApiEndpoints {
    constructor(private baseUrl: string) {}

    /**
     * Build endpoint URL
     */
    url(path: string, params?: Record<string, unknown>): string {
        return buildUrl(this.baseUrl, path, params);
    }

    /**
     * Invoice endpoints
     */
    invoices = {
        list: (params?: Record<string, unknown>) =>
            this.url(API_PATHS.INVOICES.BASE, params),
        get: (id: string) => this.url(API_PATHS.INVOICES.BY_ID(id)),
        create: () => this.url(API_PATHS.INVOICES.BASE),
        update: (id: string) => this.url(API_PATHS.INVOICES.BY_ID(id)),
        delete: (id: string) => this.url(API_PATHS.INVOICES.BY_ID(id)),
        upload: () => this.url(API_PATHS.INVOICES.UPLOAD),
        extract: () => this.url(API_PATHS.AI.EXTRACT),
    };

    /**
     * Category endpoints
     */
    categories = {
        list: (params?: Record<string, unknown>) =>
            this.url(API_PATHS.CATEGORIES.BASE, params),
        get: (id: string) => this.url(API_PATHS.CATEGORIES.BY_ID(id)),
        create: () => this.url(API_PATHS.CATEGORIES.BASE),
        update: (id: string) => this.url(API_PATHS.CATEGORIES.BY_ID(id)),
        delete: (id: string) => this.url(API_PATHS.CATEGORIES.BY_ID(id)),
    };

    /**
     * Export endpoints
     */
    export = {
        invoices: (params?: Record<string, unknown>) =>
            this.url(API_PATHS.EXPORT.INVOICES, params),
        categories: (params?: Record<string, unknown>) =>
            this.url(API_PATHS.EXPORT.CATEGORIES, params),
    };

    /**
     * Auth endpoints
     */
    auth = {
        signin: () => this.url(API_PATHS.AUTH.SIGNIN),
        signup: () => this.url(API_PATHS.AUTH.SIGNUP),
        signout: () => this.url(API_PATHS.AUTH.SIGNOUT),
        session: () => this.url(API_PATHS.AUTH.SESSION),
    };
}
