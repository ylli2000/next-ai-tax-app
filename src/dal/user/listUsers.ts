import {
    and,
    count,
    desc,
    eq,
    ilike,
    isNull,
    isNotNull,
    gte,
    lte,
} from "drizzle-orm";
import { users, userProfiles } from "@/schema/userTables";
import {
    type UserListFilters,
    type UserListSort,
    type UserListResult,
} from "@/schema/userQueries";
import { db } from "@/lib/database";

/**
 * Lists users with pagination, filtering, and sorting capabilities
 * Supports role filtering, name/email search, verification status, and date range filtering
 * @param filters - Optional filters for role, email, name, verification status, and date range
 * @param sort - Sorting configuration with field and direction
 * @param page - Page number for pagination (1-based)
 * @param limit - Number of users per page
 * @returns Paginated user list with metadata
 */
export const listUsers = async (
    filters: UserListFilters = {},
    sort: UserListSort = { field: "createdAt", direction: "desc" },
    page: number = 1,
    limit: number = 20,
): Promise<UserListResult> => {
    // Build where conditions
    const whereConditions = [];

    if (filters.role) {
        whereConditions.push(eq(users.role, filters.role));
    }

    if (filters.email) {
        whereConditions.push(ilike(users.email, `%${filters.email}%`));
    }

    if (filters.name) {
        whereConditions.push(ilike(users.name, `%${filters.name}%`));
    }

    if (filters.emailVerified !== undefined) {
        if (filters.emailVerified) {
            whereConditions.push(isNotNull(users.emailVerified));
        } else {
            whereConditions.push(isNull(users.emailVerified));
        }
    }

    if (filters.createdFrom) {
        whereConditions.push(gte(users.createdAt, filters.createdFrom));
    }

    if (filters.createdTo) {
        whereConditions.push(lte(users.createdAt, filters.createdTo));
    }

    const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(users)
        .where(whereClause);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const hasMore = offset + limit < totalCount;

    // Build base query
    const baseQuery = db
        .select({
            user: users,
            profile: userProfiles,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(whereClause)
        .limit(limit)
        .offset(offset);

    // Apply sorting based on field type
    let result;
    switch (sort.field) {
        case "companyName":
            result = await baseQuery.orderBy(
                sort.direction === "desc"
                    ? desc(userProfiles.companyName)
                    : userProfiles.companyName,
            );
            break;
        case "name":
            result = await baseQuery.orderBy(
                sort.direction === "desc" ? desc(users.name) : users.name,
            );
            break;
        case "email":
            result = await baseQuery.orderBy(
                sort.direction === "desc" ? desc(users.email) : users.email,
            );
            break;
        case "role":
            result = await baseQuery.orderBy(
                sort.direction === "desc" ? desc(users.role) : users.role,
            );
            break;
        case "updatedAt":
            result = await baseQuery.orderBy(
                sort.direction === "desc"
                    ? desc(users.updatedAt)
                    : users.updatedAt,
            );
            break;
        default: // createdAt
            result = await baseQuery.orderBy(
                sort.direction === "desc"
                    ? desc(users.createdAt)
                    : users.createdAt,
            );
            break;
    }

    return {
        users: result,
        totalCount,
        hasMore,
    };
};
