import { handlers } from "@/lib/auth";

/**
 * NextAuth.js API route handler
 * Official docs: https://next-auth.js.org/configuration/initialization#route-handlers-app
 *
 * Handles all NextAuth.js authentication routes:
 * - GET /api/auth/signin - Sign in page
 * - POST /api/auth/signin - Process sign in
 * - GET/POST /api/auth/callback/[provider] - OAuth callbacks
 * - GET /api/auth/signout - Sign out page
 * - POST /api/auth/signout - Process sign out
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - Get CSRF token
 * - GET /api/auth/providers - Get configured providers
 */
export const { GET, POST } = handlers;
