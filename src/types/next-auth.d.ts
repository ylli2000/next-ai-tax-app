import type { DefaultSession, DefaultUser } from "next-auth/types";
import type { UserRole } from "@/schema/userSchema";

//NextAuth v5
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: UserRole;
            emailVerified?: Date | null;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role?: UserRole;
        emailVerified?: Date | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: UserRole;
        emailVerified?: Date | null;
    }
}
