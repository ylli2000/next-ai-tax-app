import { eq } from "drizzle-orm";
import { userProfiles, type UserProfile } from "@/schema/userTables";
import { type UpdateUserProfileData } from "@/schema/userQueries";
import { logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Updates user profile information (company name, notification preferences)
 * Automatically updates the updatedAt timestamp
 * @param userId - User ID whose profile to update
 * @param updateData - Profile data to update
 * @returns Updated profile data
 */
export const updateUserProfile = async (
    userId: string,
    updateData: UpdateUserProfileData,
): Promise<UserProfile> => {
    const [updatedProfile] = await db
        .update(userProfiles)
        .set({
            ...updateData,
            updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();

    logInfo(`User profile updated successfully`, {
        userId,
        updatedFields: Object.keys(updateData),
    });

    return updatedProfile;
};
