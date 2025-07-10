import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { db } from "@/dal/db";
import { AUTH_CONSTANTS, SESSION_STRATEGY } from "@/schema/authSchema";
import { env } from "@/schema/envSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { ROUTES } from "@/schema/routeSchema";
import {
    accounts,
    sessions,
    userProfiles,
    users,
    verificationTokens,
} from "@/schema/userTables";
import { getDefaultUserProfile } from "@/utils/authUtils";
import { logError, logInfo } from "@/utils/logUtils";
import { UserRole } from "@/schema/userSchema";

export const { auth, signIn, signOut, handlers } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    debug: process.env.NODE_ENV === "development",

    providers: [
        Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
        }),
        GitHub({
            clientId: env.AUTH_GITHUB_ID,
            clientSecret: env.AUTH_GITHUB_SECRET,
        }),
    ],

    session: {
        strategy: SESSION_STRATEGY,
        maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE * 60, // Convert minutes to seconds
    },

    pages: {
        signIn: ROUTES.AUTH.SIGNIN,
        error: ROUTES.AUTH.ERROR,
    },

    callbacks: {
        async signIn({ account }) {
            try {
                // Allow OAuth sign-ins
                if (
                    account?.provider === AUTH_CONSTANTS.PROVIDERS.GOOGLE ||
                    account?.provider === AUTH_CONSTANTS.PROVIDERS.GITHUB
                ) {
                    return true;
                }
                return false;
            } catch (error) {
                logError("SignIn callback error:", error);
                return false;
            }
        },

        async jwt({ token, user }) {
            // Initial sign in - populate token with user data
            // Official docs: https://next-auth.js.org/configuration/callbacks#jwt-callback
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image; // Store as 'picture' in JWT (OAuth standard)

                // Get user role and verification status from database
                try {
                    const dbUser = await db.query.users.findFirst({
                        where: (users, { eq }) => eq(users.id, user.id!),
                    });

                    if (dbUser) {
                        token.role = dbUser.role;
                        token.emailVerified = dbUser.emailVerified
                            ? dbUser.emailVerified
                            : null;
                    } else {
                        // Default values for new users
                        token.role = "USER";
                        token.emailVerified = false;
                    }
                } catch (error) {
                    logError("JWT callback database query error:", error);
                    // Fallback values
                    token.role = "USER";
                    token.emailVerified = null;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id =
                    token.sub || (token.id as string | null | undefined) || "";
                session.user.email = token.email || "";
                session.user.name = token.name;
                session.user.image = token.picture; // OAuth standard field for user avatar
                session.user.role =
                    (token.role as UserRole | null | undefined) || "USER";
                session.user.emailVerified =
                    (token.emailVerified as Date & true) || null;
            }

            return session;
        },

        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            // Allows callback URLs on the same origin
            if (new URL(url).origin === baseUrl) {
                return url;
            }
            return baseUrl;
        },
    },

    events: {
        async signIn({ user, account, isNewUser }) {
            logInfo("User signed in:", {
                userId: user.id,
                email: user.email,
                provider: account?.provider,
                isNewUser,
            });

            // Create user profile for new users
            if (isNewUser && user.id) {
                try {
                    const defaultProfile = getDefaultUserProfile(user.id);
                    await db.insert(userProfiles).values({ ...defaultProfile });
                    logInfo("Created user profile for new user:", user.id);
                } catch (error) {
                    logError(
                        ERROR_MESSAGES.FAILED_TO_CREATE_USER_PROFILE,
                        error,
                    );
                }
            }
        },

        async signOut(context) {
            if ("token" in context && context.token) {
                const userId = context.token.id;
                const email = context.token.email;
                logInfo("User signed out:", { userId, email });
            } else if ("session" in context && context.session) {
                const userId = context.session.userId;
                logInfo("User signed out:", { userId });
            }
        },
    },
});
