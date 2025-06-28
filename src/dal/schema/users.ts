import { createId } from '@paralleldrive/cuid2';
import { boolean, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { SYSTEM_CONSTANTS } from '../../utils/constants';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ACCOUNTANT', 'ADMIN']);
export const themeEnum = pgEnum('theme', ['LIGHT', 'DARK', 'SYSTEM']);

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