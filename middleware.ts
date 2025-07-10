import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/schema/routeSchema";
import { isProtectedRoute, isPublicRoute } from "@/utils/routeUtils";
import { logDebug } from "@/utils/logUtils";
/**
 * NextAuth.js middleware for route protection
 * Official docs: https://next-auth.js.org/configuration/nextjs#middleware
 *
 * This middleware runs on every request and:
 * - Protects routes that require authentication
 * - Redirects unauthenticated users to sign-in page
 * - Allows public routes to be accessed without authentication
 */
export default auth((req: NextRequest & { auth: any }) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    // Use centralized route constants and helper functions for type safety
    const isProtected = isProtectedRoute(nextUrl.pathname);
    const isPublic = isPublicRoute(nextUrl.pathname);

    logDebug("isProtectedRoute", isProtected);
    logDebug("isPublicRoute", isPublic);
    logDebug("isLoggedIn", isLoggedIn);
    logDebug("nextUrl", nextUrl);

    // Redirect unauthenticated users trying to access protected routes
    if (isProtected && !isLoggedIn) {
        const signInUrl = new URL(ROUTES.AUTH.SIGNIN, nextUrl.origin);
        signInUrl.searchParams.set("callbackUrl", nextUrl.href);
        return NextResponse.redirect(signInUrl);
    }

    // Redirect authenticated users away from auth pages
    if (isLoggedIn && nextUrl.pathname.startsWith(ROUTES.AUTH.SIGNIN)) {
        return NextResponse.redirect(new URL(ROUTES.DASHBOARD, nextUrl.origin));
    }

    // Allow all other requests to proceed
    return NextResponse.next();
});

/**
 * Matcher configuration for middleware
 * Docs: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 *
 * This middleware will run on:
 * - All routes except static files and API routes
 * - But includes /api/auth routes for NextAuth
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes, except /api/auth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!api(?!/auth)|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
    ],
};
