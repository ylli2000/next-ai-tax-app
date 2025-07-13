import { eq } from "drizzle-orm";
import { userProfiles } from "@/schema/userTables";
import {
    type UpdateUserProfileData,
    updateUserProfileDataSchema,
} from "@/schema/userQueries";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/schema/messageSchema";
import { logError, logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Updates user profile information (company name, notification preferences)
 * Validates input data and automatically updates the updatedAt timestamp
 * @param userId - User ID whose profile to update
 * @param updateData - Profile data to update
 * @returns Success response with updated profile data, or error response
 */
export const updateUserProfile = async (
    userId: string,
    updateData: UpdateUserProfileData,
) => {
    try {
        const validatedData = updateUserProfileDataSchema.parse(updateData);
        const [updatedProfile] = await db
            .update(userProfiles)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, userId))
            .returning();
        if (!updatedProfile) {
            return {
                success: false,
                error: ERROR_MESSAGES.USER_PROFILE_NOT_FOUND,
                data: null,
            };
        }
        logInfo(`User profile updated successfully`, {
            userId,
            updatedFields: Object.keys(validatedData),
        });
        return {
            success: true,
            data: updatedProfile,
            message: SUCCESS_MESSAGES.USER_PROFILE_UPDATED_SUCCESSFULLY,
        };
    } catch (error) {
        logError("Failed to update user profile", {
            error,
            userId,
            updateData,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.USER_PROFILE_UPDATE_FAILED,
            data: null,
        };
    }
};
