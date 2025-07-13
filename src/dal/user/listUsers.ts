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
    userListFiltersSchema,
    userListSortSchema,
} from "@/schema/userQueries";
import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { logError } from "@/utils/logUtils";
import { db } from "../db";

// User Query Operations
/**
 * Lists users with pagination, filtering, and sorting capabilities
 * Supports role filtering, name/email search, verification status, and date range filtering
 * @param filters - Optional filters for role, email, name, verification status, and date range
 * @param sort - Sorting configuration with field and direction
 * @param page - Page number for pagination (1-based)
 * @param limit - Number of users per page
 * @returns Success response with paginated user list and metadata, or error response
 */
export const listUsers = async (
    filters: UserListFilters = {},
    sort: UserListSort = { field: "createdAt", direction: "desc" },
    page: number = 1,
    limit: number = 20,
) => {
    try {
        const validatedFilters = userListFiltersSchema.parse(filters);
        const validatedSort = userListSortSchema.parse(sort);

        // Build where conditions
        const whereConditions = [];

        if (validatedFilters.role) {
            whereConditions.push(eq(users.role, validatedFilters.role));
        }

        if (validatedFilters.email) {
            whereConditions.push(
                ilike(users.email, `%${validatedFilters.email}%`),
            );
        }

        if (validatedFilters.name) {
            whereConditions.push(
                ilike(users.name, `%${validatedFilters.name}%`),
            );
        }

        if (validatedFilters.emailVerified !== undefined) {
            if (validatedFilters.emailVerified) {
                whereConditions.push(isNotNull(users.emailVerified));
            } else {
                whereConditions.push(isNull(users.emailVerified));
            }
        }

        if (validatedFilters.createdFrom) {
            whereConditions.push(
                gte(users.createdAt, validatedFilters.createdFrom),
            );
        }

        if (validatedFilters.createdTo) {
            whereConditions.push(
                lte(users.createdAt, validatedFilters.createdTo),
            );
        }

        const whereClause =
            whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Get total count
        const [{ count: total }] = await db
            .select({ count: count() })
            .from(users)
            .where(whereClause);

        // Calculate pagination
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // Get users with profiles - handle ordering safely
        let result;
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
        switch (validatedSort.field) {
            case "companyName":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(userProfiles.companyName)
                        : userProfiles.companyName,
                );
                break;
            case "name":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(users.name)
                        : users.name,
                );
                break;
            case "email":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(users.email)
                        : users.email,
                );
                break;
            case "role":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(users.role)
                        : users.role,
                );
                break;
            case "updatedAt":
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(users.updatedAt)
                        : users.updatedAt,
                );
                break;
            default: // createdAt
                result = await baseQuery.orderBy(
                    validatedSort.direction === "desc"
                        ? desc(users.createdAt)
                        : users.createdAt,
                );
                break;
        }

        return {
            success: true,
            data: {
                users: result,
                total,
                page,
                limit,
                totalPages,
            },
        };
    } catch (error) {
        logError("Failed to list users", { error, filters, sort, page, limit });
        return {
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            data: null,
        };
    }
};
