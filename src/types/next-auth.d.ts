import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole } from "@/schema/userSchema";

/**
 * Module augmentation for NextAuth.js to include custom fields
 * Official docs: https://next-auth.js.org/getting-started/typescript#module-augmentation
 *
 * This is the official NextAuth.js recommended way to add custom fields to session and JWT
 */
declare module "next-auth" {
    /**
     * Extend Session interface to include custom user fields
     * Docs: https://next-auth.js.org/getting-started/typescript#session
     */
    interface Session {
        user: {
            id: string;
            role?: UserRole;
            emailVerified?: boolean;
        } & DefaultSession["user"];
    }

    /**
     * Extend User interface to include custom fields
     * Docs: https://next-auth.js.org/getting-started/typescript#user
     */
    interface User extends DefaultUser {
        role?: UserRole;
        emailVerified?: boolean;
    }
}

/**
 * Extend JWT interface to include custom claims
 * Docs: https://next-auth.js.org/getting-started/typescript#jwt
 */
declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: UserRole;
        emailVerified?: boolean;
    }
}
