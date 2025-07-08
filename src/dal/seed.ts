import { SYSTEM_DEFAULT } from "@/schema/commonSchemas";
import { logError, logInfo } from "@/utils/logUtils";
import { userProfiles, users } from "../schema/userTables";
import { db } from "./db";
/**
 * Seed the database with initial data
 */
export async function seedDatabase() {
    logInfo("🌱 Starting database seeding...");

    try {
        // Create admin user
        const adminEmail = SYSTEM_DEFAULT.DEFAULT_ADMIN_EMAIL;

        const [adminUser] = await db
            .insert(users)
            .values({
                email: adminEmail,
                name: SYSTEM_DEFAULT.DEFAULT_ADMIN_NAME,
                role: "ADMIN",
                emailVerified: new Date(),
            })
            .returning();

        logInfo("✅ Created admin user:", adminUser.email);

        // Create admin profile
        await db.insert(userProfiles).values({
            userId: adminUser.id,
            companyName: null,
            notificationsEnabled: SYSTEM_DEFAULT.DEFAULT_NOTIFICATIONS_ENABLED,
        });

        logInfo("✅ Created admin profile");

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
