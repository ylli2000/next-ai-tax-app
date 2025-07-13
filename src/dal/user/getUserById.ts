import { eq } from "drizzle-orm";
import { users, userProfiles } from "@/schema/userTables";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Retrieves a user by their unique ID along with their profile
 * @param id - User ID to search for
 * @returns Success response with user and profile data, or error if not found
 */
export const getUserById = async (id: string) => {
    try {
        const result = await db
            .select({
                user: users,
                profile: userProfiles,
            })
            .from(users)
            .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
            .where(eq(users.id, id))
            .limit(1);
        if (result.length === 0) {
            return {
                success: false,
                error: ERROR_MESSAGES.USER_NOT_FOUND,
                data: null,
            };
        }
        const [{ user, profile }] = result;
        return {
            success: true,
            data: { user, profile },
        };
    } catch (error) {
        logError("Failed to get user by ID", { error, userId: id });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
