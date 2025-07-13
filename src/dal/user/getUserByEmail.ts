import { eq } from "drizzle-orm";
import { users, userProfiles } from "@/schema/userTables";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Retrieves a user by their email address along with their profile
 * @param email - Email address to search for
 * @returns Success response with user and profile data, or error if not found
 */
export const getUserByEmail = async (email: string) => {
    try {
        const result = await db
            .select({
                user: users,
                profile: userProfiles,
            })
            .from(users)
            .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
            .where(eq(users.email, email))
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
        logError("Failed to get user by email", { error, email });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
