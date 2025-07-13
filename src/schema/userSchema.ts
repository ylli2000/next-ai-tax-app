import { z } from "zod";

export const USER_CONSTANTS = {
    DEFAULT_ADMIN_EMAIL: "admin@example.com", // Used in seed.ts for creating admin user
    DEFAULT_ADMIN_NAME: "System Administrator", // Used in seed.ts for admin display name
    DEFAULT_USER_ROLE: "USER" as UserRole, // Used in user registration and role assignment
};
// User Role Enum (moved from AUTH_CONSTANTS.VALID_USER_ROLES)
export const UserRoleEnum = ["USER", "ACCOUNTANT", "ADMIN"] as const;
export const userRoleSchema = z.enum(UserRoleEnum);
export type UserRole = z.infer<typeof userRoleSchema>;
