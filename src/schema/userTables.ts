import { createId } from "@paralleldrive/cuid2";
import {
    boolean,
    integer,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { UI_CONSTANTS } from "./uiSchema";
import { USER_CONSTANTS, UserRoleEnum } from "./userSchema";

export const userRoleEnum = pgEnum("user_role", UserRoleEnum);

// NextAuth compliant users table
export const users = pgTable("users", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => createId()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: userRoleEnum("role")
        .notNull()
        .default(USER_CONSTANTS.DEFAULT_USER_ROLE),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// NextAuth compliant accounts table
export const accounts = pgTable(
    "accounts",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.provider, table.providerAccountId] }),
    ],
);

// NextAuth compliant sessions table
export const sessions = pgTable("sessions", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// NextAuth compliant verification tokens table
export const verificationTokens = pgTable(
    "verification_tokens",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// Business extension: user profiles table
export const userProfiles = pgTable("user_profiles", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => createId()),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" })
        .unique(),
    companyName: text("company_name"),
    notificationsEnabled: boolean("notifications_enabled")
        .notNull()
        .default(UI_CONSTANTS.DEFAULT_NOTIFICATIONS_ENABLED),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
