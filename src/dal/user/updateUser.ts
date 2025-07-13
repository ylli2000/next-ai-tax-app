import { eq } from "drizzle-orm";
import { users, type User } from "@/schema/userTables";
import { type UpdateUserData } from "@/schema/userQueries";
import { logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Updates user basic information (name, role)
 * Automatically updates the updatedAt timestamp
 * @param id - User ID to update
 * @param updateData - Data to update (name and/or role)
 * @returns Updated user data
 */
export const updateUser = async (
    id: string,
    updateData: UpdateUserData,
): Promise<User> => {
    const [updatedUser] = await db
        .update(users)
        .set({
            ...updateData,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

    logInfo(`User updated successfully: ${updatedUser.email}`, {
        userId: id,
        updatedFields: Object.keys(updateData),
    });

    return updatedUser;
};
