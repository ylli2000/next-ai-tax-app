import { createId } from '@paralleldrive/cuid2';
import { boolean, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { SYSTEM_CONSTANTS } from '../utils/constants';

export const UserRoleEnum = ['USER', 'ACCOUNTANT', 'ADMIN'] as const;
export const userRoleSchema = z.enum(UserRoleEnum);
export type UserRole = z.infer<typeof userRoleSchema>;

export const ThemeEnum = ['LIGHT', 'DARK', 'SYSTEM'] as const;
export const themeSchema = z.enum(ThemeEnum);
export type Theme = z.infer<typeof themeSchema>;

export const userRoleEnum = pgEnum('user_role', UserRoleEnum);
export const themeEnum = pgEnum('theme', ThemeEnum);

export const users = pgTable('users', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    email: text('email').notNull().unique(),
    emailVerified: timestamp('email_verified'),
    name: text('name'),
    image: text('image'),
    role: userRoleEnum('role').notNull().default(SYSTEM_CONSTANTS.DEFAULT_USER_ROLE),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: timestamp('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    sessionToken: text('session_token').notNull().unique(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProfiles = pgTable('user_profiles', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
    displayName: text('display_name'),
    timezone: text('timezone'),
    language: text('language').notNull().default(SYSTEM_CONSTANTS.DEFAULT_LANGUAGE),
    theme: themeEnum('theme').notNull().default(SYSTEM_CONSTANTS.DEFAULT_THEME),
    notificationsEnabled: boolean('notifications_enabled').notNull().default(SYSTEM_CONSTANTS.DEFAULT_NOTIFICATIONS_ENABLED),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);
export type User = typeof users.$inferSelect;

export const selectAccountSchema = createSelectSchema(accounts);
export const insertAccountSchema = createInsertSchema(accounts);
export type Account = typeof accounts.$inferSelect;

export const selectSessionSchema = createSelectSchema(sessions);
export const insertSessionSchema = createInsertSchema(sessions);
export type Session = typeof sessions.$inferSelect;

export const selectVerificationTokenSchema = createSelectSchema(verificationTokens);
export const insertVerificationTokenSchema = createInsertSchema(verificationTokens);
export type VerificationToken = typeof verificationTokens.$inferSelect;

export const selectUserProfileSchema = createSelectSchema(userProfiles);
export const insertUserProfileSchema = createInsertSchema(userProfiles);
export type UserProfile = typeof userProfiles.$inferSelect;

export const createUserDataSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    role: userRoleSchema.optional(),
});
export type CreateUserData = z.infer<typeof createUserDataSchema>;

export const updateUserDataSchema = z.object({
    name: z.string().optional(),
    role: userRoleSchema.optional(),
});
export type UpdateUserData = z.infer<typeof updateUserDataSchema>;

export const updateUserProfileDataSchema = z.object({
    displayName: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    theme: themeSchema.optional(),
    notificationsEnabled: z.boolean().optional(),
});
export type UpdateUserProfileData = z.infer<typeof updateUserProfileDataSchema>; 