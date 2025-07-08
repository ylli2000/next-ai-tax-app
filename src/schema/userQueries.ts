import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { SortOrderEnum } from "./commonSchemas";
import { userRoleSchema } from "./userSchema";
import {
    accounts,
    sessions,
    userProfiles,
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
export const createUserDataSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    role: userRoleSchema.optional().default("USER"),
    sendWelcomeEmail: z.boolean().optional().default(true),
});
export type CreateUserData = z.infer<typeof createUserDataSchema>;

export const updateUserDataSchema = z.object({
    name: z.string().optional(),
    role: userRoleSchema.optional(),
});
export type UpdateUserData = z.infer<typeof updateUserDataSchema>;

export const updateUserProfileDataSchema = z.object({
    companyName: z.string().optional(),
    notificationsEnabled: z.boolean().optional(),
});
export type UpdateUserProfileData = z.infer<typeof updateUserProfileDataSchema>;

// User List Filters
export const userListFiltersSchema = z.object({
    role: userRoleSchema.optional(),
    email: z.string().optional(),
    name: z.string().optional(),
    emailVerified: z.boolean().optional(),
    createdFrom: z.date().optional(),
    createdTo: z.date().optional(),
});
export type UserListFilters = z.infer<typeof userListFiltersSchema>;

export const userListSortSchema = z.object({
    field: z.enum([
        "name",
        "email",
        "companyName",
        "role",
        "createdAt",
        "updatedAt",
    ]),
    direction: z.enum(SortOrderEnum),
});
export type UserListSort = z.infer<typeof userListSortSchema>;

export const userStatsSchema = z.object({
    totalUsers: z.number().int(),
    roleBreakdown: z.record(
        userRoleSchema,
        z.object({
            count: z.number().int(),
            percentage: z.number(),
        }),
    ),
    recentRegistrations: z.array(
        z.object({
            date: z.string(),
            count: z.number().int(),
        }),
    ),
    verificationStats: z.object({
        verified: z.number().int(),
        unverified: z.number().int(),
        verificationRate: z.number(),
    }),
});
export type UserStats = z.infer<typeof userStatsSchema>;
