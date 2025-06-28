import { DEFAULT_CATEGORIES_SEED, SYSTEM_CONSTANTS } from '../utils/constants';
import { db } from './db';
import { categories, userProfiles, users } from './schema';

/**
 * Seed the database with initial data
 */
export async function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    try {
        // Create admin user
        const adminEmail = SYSTEM_CONSTANTS.DEFAULT_ADMIN_EMAIL;

        const [adminUser] = await db.insert(users).values({
            email: adminEmail,
            name: SYSTEM_CONSTANTS.DEFAULT_ADMIN_NAME,
            role: 'ADMIN',
            emailVerified: new Date(),
        }).returning();

        console.log('✅ Created admin user:', adminUser.email);

        // Create admin profile
        await db.insert(userProfiles).values({
            userId: adminUser.id,
            displayName: SYSTEM_CONSTANTS.DEFAULT_ADMIN_NAME,
            language: SYSTEM_CONSTANTS.DEFAULT_LANGUAGE,
            theme: 'SYSTEM',
            notificationsEnabled: SYSTEM_CONSTANTS.DEFAULT_NOTIFICATIONS_ENABLED,
        });

        console.log('✅ Created admin profile');

        // Create default categories using constants
        for (const category of DEFAULT_CATEGORIES_SEED) {
            await db.insert(categories).values({
                userId: adminUser.id,
                name: category.name,
                description: category.description,
                color: category.color,
                isDefault: 'true',
            });
        }

        console.log('✅ Created default categories');
        console.log('🎉 Database seeding completed successfully!');
        console.log(`👤 Admin email: ${adminEmail}`);

    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        throw error;
    }
}

// Run seed if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
} 