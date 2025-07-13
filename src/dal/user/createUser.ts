import { SQL, eq } from "drizzle-orm";
import { ZodNull } from "zod";
import {
    users,
    userProfiles,
    type User,
    type UserProfile,
} from "@/schema/userTables";
import {
    type CreateUserData,
    createUserDataSchema,
} from "@/schema/userQueries";
import {
    ERROR_MESSAGES,
    ErrorMessageValue,
    SUCCESS_MESSAGES,
} from "@/schema/messageSchema";
import { getDefaultUserProfile } from "@/utils/authUtils";
import { logError, logInfo } from "@/utils/logUtils";
import { type ApiResponse } from "@/schema/apiSchema";
import { db } from "../db";

/**
 * Private helper function to check if a user exists by a given condition
 * @param cond - SQL condition to check against
 * @param errorMessage - Error message to return if user exists
 * @returns False if user doesn't exist, or ApiResponse with error if user exists
 */
const isFound = async (
    cond: SQL,
    errorMessage: ErrorMessageValue,
): Promise<false | ApiResponse<ZodNull>> => {
    const found = await db.select().from(users).where(cond).limit(1);
    if (found.length > 0) {
        return {
            success: false,
            error: errorMessage,
            data: null,
        };
    }
    return false;
};

/**
 * Private helper function to create a user and profile in a database transaction
 * Ensures both user and profile are created together or both fail
 * @param userData - Validated user data
 * @returns Promise containing both user and profile objects
 */
const createUserTransaction = async ({
    email,
    name,
    role,
}: CreateUserData): Promise<{ user: User; profile: UserProfile }> =>
    await db.transaction(async (tx) => {
        const [newUser] = await tx
            .insert(users)
            .values({
                email: email,
                name: name,
                role: role || "USER",
            })
            .returning();
        const defaultProfile = getDefaultUserProfile(newUser.id);
        const [newProfile] = await tx
            .insert(userProfiles)
            .values(defaultProfile)
            .returning();
        return {
            user: newUser,
            profile: newProfile,
        };
    });

/**
 * Creates a new user with default profile
 * Validates input data, checks for existing user, and creates both user and profile in transaction
 * @param userData - User creation data containing email, name, and optional role
 * @returns Success response with user and profile data, or error response
 */
export const createUser = async (userData: CreateUserData) => {
    try {
        const validatedData = createUserDataSchema.parse(userData);
        const cond = eq(users.email, validatedData.email);
        const res = await isFound(cond, ERROR_MESSAGES.USER_ALREADY_EXISTS);
        if (res) return res;
        const { user, profile } = await createUserTransaction(validatedData);
        logInfo(`User created successfully: ${user.email}`, {
            userId: user.id,
            role: user.role,
        });
        return {
            success: true,
            message: SUCCESS_MESSAGES.USER_CREATED_SUCCESSFULLY,
            data: { user, profile },
        };
    } catch (error) {
        logError("Failed to create user", { error, userData });
        return {
            success: false,
            error: ERROR_MESSAGES.USER_CREATION_FAILED,
            data: null,
        };
    }
};
