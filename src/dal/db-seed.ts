// Load environment variables from .env file
import { config } from "dotenv";
config();
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { USER_CONSTANTS } from "@/schema/userSchema";
import { UI_CONSTANTS } from "@/schema/uiSchema";
import { logError, logInfo } from "@/utils/sys/log";
import { userProfiles, users } from "../schema/userTables";
import { env } from "../utils/sys/env"; //THIS IS SEPARATE FROM THE db.ts FILE, SEED IS INDEPENDENT
import * as invoiceTables from "../schema/invoiceTables";
import * as userTables from "../schema/userTables";

// Combine all table schemas
const schema = { ...userTables, ...invoiceTables };

// Create the connection
const sql = neon(env.DATABASE_URL);

// Create the database instance
export const db = drizzle(sql, { schema });

// Export types
export type Database = typeof db;

/**
 * Seed the database with initial data
 */
export async function seedDatabase() {
    logInfo("🌱 Starting database seeding...");
    try {
        // Create admin user with upsert logic
        const adminEmail = USER_CONSTANTS.DEFAULT_ADMIN_EMAIL;
        // Check if admin user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, adminEmail),
        });
        let adminUser;
        if (existingUser) {
            logInfo(`ℹ️ Admin user already exists: ${adminEmail}`);
            adminUser = existingUser;
        } else {
            // Create new admin user
            const [newAdminUser] = await db
                .insert(users)
                .values({
                    email: adminEmail,
                    name: USER_CONSTANTS.DEFAULT_ADMIN_NAME,
                    role: "ADMIN",
                    emailVerified: new Date(),
                })
                .returning();
            adminUser = newAdminUser;
            logInfo("✅ Created new admin user:", adminUser.email);
        }
        // Check if admin profile already exists
        const existingProfile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, adminUser.id),
        });
        if (existingProfile) {
            logInfo(
                `ℹ️ Admin profile already exists for user: ${adminUser.id}`,
            );
        } else {
            // Create admin profile
            await db.insert(userProfiles).values({
                userId: adminUser.id,
                companyName: null,
                notificationsEnabled:
                    UI_CONSTANTS.DEFAULT_NOTIFICATIONS_ENABLED,
            });
            logInfo("✅ Created new admin profile");
        }

        logInfo("🎉 Database seeding completed successfully!");
        logInfo(`👤 Admin email: ${adminEmail}`);
    } catch (error) {
        logError("❌ Database seeding failed:", error);
        throw error;
    }
}

// Run seed if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            logError("❌ Error seeding database:", error);
            process.exit(1);
        });
}
