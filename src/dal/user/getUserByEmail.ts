import { eq } from "drizzle-orm";
import { users, userProfiles } from "@/schema/userTables";
import { type UserWithProfile } from "@/schema/userQueries";
import { db } from "../db";

/**
 * Retrieves a user by their email address along with their profile
 * @param email - Email address to search for
 * @returns User with profile data, or null if not found
 */
export const getUserByEmail = async (
    email: string,
): Promise<UserWithProfile | null> => {
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
        return null;
    }

    const [{ user, profile }] = result;
    return { user, profile };
};
