import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { SortOrder } from "./commonSchemas";
import { UserRole } from "./userSchema";
import {
    accounts,
    sessions,
    UserProfile,
    userProfiles,
    User,
    users,
    verificationTokens,
} from "./userTables";

export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);
//export type User from userTables.ts

export const selectAccountSchema = createSelectSchema(accounts);
export const insertAccountSchema = createInsertSchema(accounts);
//export type Account from userTables.ts

export const selectSessionSchema = createSelectSchema(sessions);
export const insertSessionSchema = createInsertSchema(sessions);
//export type Session from userTables.ts

export const selectVerificationTokenSchema =
    createSelectSchema(verificationTokens);
export const insertVerificationTokenSchema =
    createInsertSchema(verificationTokens);
//export type VerificationToken from userTables.ts

export const selectUserProfileSchema = createSelectSchema(userProfiles);
export const insertUserProfileSchema = createInsertSchema(userProfiles);
//export type UserProfile from userTables.ts

// Create User Data
export type CreateUserData = {
    email: string;
    name?: string;
    role?: UserRole;
    sendWelcomeEmail?: boolean;
};

export type UpdateUserData = {
    name?: string;
    role?: UserRole;
};

export type UpdateUserProfileData = {
    companyName?: string;
    notificationsEnabled?: boolean;
};

// User List Filters
export type UserListFilters = {
    role?: UserRole;
    email?: string;
    name?: string;
    emailVerified?: boolean;
    createdFrom?: Date;
    createdTo?: Date;
};

export type UserListSort = {
    field:
        | "name"
        | "email"
        | "companyName"
        | "role"
        | "createdAt"
        | "updatedAt";
    direction: SortOrder;
};

export type UserStats = {
    totalUsers: number;
    roleBreakdown: Record<UserRole, { count: number; percentage: number }>;
    recentRegistrations: { date: string; count: number }[];
    verificationStats: {
        verified: number;
        unverified: number;
        verificationRate: number;
    };
};

// DAL layer return types (pure data, no API response wrapper)
export type UserWithProfile = {
    user: User;
    profile: UserProfile | null;
};

export type CreateUserResult = {
    user: User;
    profile: UserProfile;
};

export type UserListResult = {
    users: UserWithProfile[];
    totalCount: number;
    hasMore: boolean;
};
