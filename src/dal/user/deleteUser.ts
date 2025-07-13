import { eq } from "drizzle-orm";
import { users } from "@/schema/userTables";
import { logInfo } from "@/utils/logUtils";
import { db } from "../db";

/**
 * Deletes a user and their associated profile
 * Database constraints handle cascading deletion of associated profiles
 * @param id - User ID to delete
 */
export const deleteUser = async (id: string): Promise<void> => {
    await db.delete(users).where(eq(users.id, id));

    logInfo(`User deleted successfully`, { userId: id });
};
