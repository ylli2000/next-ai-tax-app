import { eq } from "drizzle-orm";
import { users } from "@/schema/userTables";
import {
    type UpdateUserData,
    updateUserDataSchema,
} from "@/schema/userQueries";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Updates user basic information (name, role)
 * Validates input data and automatically updates the updatedAt timestamp
 * @param id - User ID to update
 * @param updateData - Data to update (name and/or role)
 * @returns Success response with updated user data, or error response
 */
export const updateUser = async (id: string, updateData: UpdateUserData) => {
    try {
        const validatedData = updateUserDataSchema.parse(updateData);
        const [updatedUser] = await db
            .update(users)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();
        if (!updatedUser) {
            return {
                success: false,
                error: ERROR_MESSAGES.USER_NOT_FOUND,
                data: null,
            };
        }
        logInfo(`User updated successfully: ${updatedUser.email}`, {
            userId: id,
            updatedFields: Object.keys(validatedData),
        });
        return {
            success: true,
            data: updatedUser,
            message: SUCCESS_MESSAGES.USER_UPDATED_SUCCESSFULLY,
        };
    } catch (error) {
        logError("Failed to update user", { error, userId: id, updateData });
        return {
            success: false,
            error: ERROR_MESSAGES.USER_UPDATE_FAILED,
            data: null,
        };
    }
};
