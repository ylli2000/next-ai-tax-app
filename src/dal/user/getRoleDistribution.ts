import { count } from "drizzle-orm";
import { users } from "@/schema/userTables";
import { type UserRole } from "@/schema/userSchema";
import { db } from "../db";

/**
 * Gets the distribution count of users by role
 * Returns a simple count breakdown for each user role
 * @returns Role distribution counts
 */
export const getRoleDistribution = async (): Promise<
    Record<UserRole, number>
> => {
    const roleStats = await db
        .select({
            role: users.role,
            count: count(),
        })
        .from(users)
        .groupBy(users.role);

    const distribution = roleStats.reduce(
        (acc, stat) => {
            acc[stat.role] = stat.count;
            return acc;
        },
        {} as Record<UserRole, number>,
    );

    return distribution;
};
