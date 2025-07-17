import { eq } from "drizzle-orm";
import { users, userProfiles } from "@/schema/userTables";
import { type UserWithProfile } from "@/schema/userQueries";
import { db } from "@/lib/database";

/**
 * Retrieves a user by their unique ID along with their profile
 * @param id - User ID to search for
 * @returns User with profile data, or null if not found
 */
export const getUserById = async (
    id: string,
): Promise<UserWithProfile | null> => {
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
        return null;
    }

    const [{ user, profile }] = result;
    return { user, profile };
};
