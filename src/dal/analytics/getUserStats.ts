import { count, isNotNull, gte } from "drizzle-orm";
import { users } from "@/schema/userTables";
import { type UserStats } from "@/schema/userQueries";
import { AUTH_CONSTANTS } from "@/schema/authSchema";
import { db } from "../db";

/**
 * Generates comprehensive user statistics and analytics
 * Includes total counts, role distribution, verification rates, and recent registrations
 * @returns User statistics data
 * @throws Error if database query fails
 */
export const getUserStats = async (): Promise<UserStats> => {
    const { totalUsers, roleBreakdown } = await getRoleStats();
    const verified = await getEmailVerificationStats();
    const formattedRecentRegistrations = await getRecentRegistrations();

    return {
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
