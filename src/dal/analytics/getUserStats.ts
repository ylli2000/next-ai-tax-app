import { count, isNotNull, gte } from "drizzle-orm";
import { users } from "@/schema/userTables";
import { type UserStats } from "@/schema/userQueries";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { AUTH_CONSTANTS } from "@/schema/authSchema";
import { db } from "../db";

/**
 * Generates comprehensive user statistics and analytics
 * Includes total counts, role distribution, verification rates, and recent registrations
 * @returns Success response with detailed user statistics, or error response
 */
export const getUserStats = async () => {
    try {
        const { totalUsers, roleBreakdown } = await getRoleStats();
        const verified = await getEmailVerificationStats();
        const formattedRecentRegistrations = await getRecentRegistrations();

        const stats: UserStats = {
            totalUsers,
            roleBreakdown,
            recentRegistrations: formattedRecentRegistrations,
            verificationStats: {
                verified,
                unverified: totalUsers - verified,
                verificationRate:
                    totalUsers > 0 ? (verified / totalUsers) * 100 : 0,
            },
        };
        return {
            success: true,
            data: stats,
        };
    } catch (error) {
        logError("Failed to get user statistics", { error });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};

const getRoleStats = async () => {
    const [{ count: totalUsers }] = await db
        .select({ count: count() })
        .from(users);
    const roleStats = await db
        .select({
            role: users.role,
            count: count(),
        })
        .from(users)
        .groupBy(users.role);
    const roleBreakdown = roleStats.reduce(
        (acc, stat) => {
            acc[stat.role] = {
                count: stat.count,
                percentage: (stat.count / totalUsers) * 100,
            };
            return acc;
        },
        {} as UserStats["roleBreakdown"],
    );
    const verifiedStats = await db
        .select({ count: count() })
        .from(users)
        .where(isNotNull(users.emailVerified));
    const verified = verifiedStats[0]?.count || 0;
    const unverified = totalUsers - verified;
    return {
        totalUsers,
        roleBreakdown,
        verified,
        unverified,
    };
};
const getEmailVerificationStats = async () => {
    const verifiedStats = await db
        .select({ count: count() })
        .from(users)
        .where(isNotNull(users.emailVerified));
    const verified = verifiedStats[0]?.count || 0;
    return verified;
};
const getRecentRegistrations = async () => {
    const sevenDaysAgo = new Date(Date.now() - AUTH_CONSTANTS.ONE_WEEK_MS);
    const recentRegistrations = await db
        .select({
            date: users.createdAt,
            count: count(),
        })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo))
        .groupBy(users.createdAt)
        .orderBy(users.createdAt);
    const formattedRecentRegistrations = recentRegistrations.map((reg) => ({
        date: reg.date.toISOString().split("T")[0],
        count: reg.count,
    }));
    return formattedRecentRegistrations;
};
