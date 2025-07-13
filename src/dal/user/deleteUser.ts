import { eq } from "drizzle-orm";
import { users } from "@/schema/userTables";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Deletes a user and their associated profile
 * Checks for user existence before deletion, cascades to profile
 * @param id - User ID to delete
 * @returns Success response or error if user not found
 */
export const deleteUser = async (id: string) => {
    try {
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        if (existingUser.length === 0) {
            return {
                success: false,
                error: ERROR_MESSAGES.USER_NOT_FOUND,
                data: null,
            };
        }
        await db.delete(users).where(eq(users.id, id));
        logInfo(`User deleted successfully`, { userId: id });
        return {
            success: true,
            data: null,
            message: SUCCESS_MESSAGES.USER_DELETED_SUCCESSFULLY,
        };
    } catch (error) {
        logError("Failed to delete user", { error, userId: id });
        return {
            success: false,
            error: ERROR_MESSAGES.USER_DELETION_FAILED,
            data: null,
        };
    }
};
