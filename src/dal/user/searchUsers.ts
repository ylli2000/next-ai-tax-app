import { eq, ilike, or } from "drizzle-orm";
import { users, userProfiles } from "@/schema/userTables";
import { type UserWithProfile } from "@/schema/userQueries";
import { db } from "@/lib/database";

/**
 * Searches users by name, email, or company name using fuzzy matching
 * Performs case-insensitive partial matching across multiple fields
 * @param query - Search term to match against name, email, or company name
 * @param limit - Maximum number of results to return
 * @returns Array of matching users with profile data
 */
export const searchUsers = async (
    query: string,
    limit: number = 10,
): Promise<UserWithProfile[]> => {
    const result = await db
        .select({
            user: users,
            profile: userProfiles,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
            or(
                ilike(users.name, `%${query}%`),
                ilike(users.email, `%${query}%`),
                ilike(userProfiles.companyName, `%${query}%`),
            ),
        )
        .limit(limit);

    return result;
};
