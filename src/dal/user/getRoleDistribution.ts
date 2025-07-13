import { count } from "drizzle-orm";
import { users } from "@/schema/userTables";
import { type UserRole } from "@/schema/userSchema";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Gets the distribution count of users by role
 * Returns a simple count breakdown for each user role
 * @returns Success response with role distribution counts, or error response
 */
export const getRoleDistribution = async () => {
    try {
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

        return {
            success: true,
            data: distribution,
        };
    } catch (error) {
        logError("Failed to get role distribution", { error });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
