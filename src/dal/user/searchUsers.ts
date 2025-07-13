import { eq, ilike, or } from "drizzle-orm";
import { users, userProfiles } from "@/schema/userTables";
import { type UserRole } from "@/schema/userSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Searches users by name, email, or company name using fuzzy matching
 * Performs case-insensitive partial matching across multiple fields
 * @param query - Search term to match against name, email, or company name
 * @param limit - Maximum number of results to return
 * @returns Success response with matching users and profiles, or error response
 */
export const searchUsers = async (query: string, limit: number = 10) => {
    try {
        const result = await db
            .select({
                user: users,
                profile: userProfiles,
            })
            .from(users)
            .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
            .where(
                or(
                    ilike(users.name, `%${query}%`),
                    ilike(users.email, `%${query}%`),
                    ilike(userProfiles.companyName, `%${query}%`),
                ),
            )
            .limit(limit);

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        logError("Failed to search users", { error, query, limit });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};

/**
 * Retrieves all users with a specific role
 * Returns users with their profiles ordered by creation date
 * @param role - User role to filter by (USER, ACCOUNTANT, ADMIN)
 * @returns Success response with users matching the role, or error response
 */
export const getUsersByRole = async (role: UserRole) => {
    try {
        const result = await db
            .select({
                user: users,
                profile: userProfiles,
            })
            .from(users)
            .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
            .where(eq(users.role, role))
            .orderBy(users.createdAt);

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        logError("Failed to get users by role", { error, role });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
