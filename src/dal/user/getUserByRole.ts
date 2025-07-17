import { eq } from "drizzle-orm";
import { users, userProfiles } from "@/schema/userTables";
import { type UserRole } from "@/schema/userSchema";
import { type UserWithProfile } from "@/schema/userQueries";
import { db } from "@/lib/database";

/**
 * Retrieves all users with a specific role
 * Returns users with their profiles ordered by creation date
 * @param role - User role to filter by (USER, ACCOUNTANT, ADMIN)
 * @returns Array of users with profile data matching the role
 */
export const getUsersByRole = async (
    role: UserRole,
): Promise<UserWithProfile[]> => {
    const result = await db
        .select({
            user: users,
            profile: userProfiles,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(users.role, role))
        .orderBy(users.createdAt);

    return result;
};
