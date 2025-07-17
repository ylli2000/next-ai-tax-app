import { users, userProfiles } from "@/schema/userTables";
import {
    type CreateUserData,
    type CreateUserResult,
    insertUserSchema,
    insertUserProfileSchema,
} from "@/schema/userQueries";
import { getDefaultUserProfile } from "@/utils/core/auth";
import { logInfo } from "@/utils/sys/log";
import { db } from "@/lib/database";

/**
 * Creates a new user with default profile
 * Validates input data and creates both user and profile in transaction
 * @param userData - User creation data containing email, name, and optional role
 * @returns Created user and profile data
 */
export const createUser = async (
    userData: CreateUserData,
): Promise<CreateUserResult> => {
    const { user, profile } = await db.transaction(async (tx) => {
        const validatedData = insertUserSchema.parse(userData);
        const [newUser] = await tx
            .insert(users)
            .values(validatedData)
            .returning();

        const defaultProfile = insertUserProfileSchema.parse(
            getDefaultUserProfile(newUser.id),
        );
        const [newProfile] = await tx
            .insert(userProfiles)
            .values(defaultProfile)
            .returning();

        return {
            user: newUser,
            profile: newProfile,
        };
    });

    logInfo(`User created successfully: ${user.email}`, {
        userId: user.id,
        role: user.role,
    });

    return { user, profile };
};
