#!/usr/bin/env tsx

// Load environment variables from .env file
import { config } from "dotenv";
config();
import { neon } from "@neondatabase/serverless";
import { logError, logInfo, logWarn } from "@/utils/logUtils";
import { env } from "@/utils/envUtils";

/**
 * Hard reset the database - DROP ALL TABLES and recreate from scratch
 *
 * WARNING: This will permanently delete ALL data in the database!
 * Only use this in development environments.
 *
 * Steps:
 * 1. Connect to database
 * 2. Drop all tables in the public schema
 * 3. The script will exit, then package.json will run db:push && db:seed
 */
async function hardResetDatabase() {
    if (env.NODE_ENV === "production") {
        logError("❌ HARD RESET IS DISABLED IN PRODUCTION!");
        logError("❌ This would delete all production data!");
        process.exit(1);
    }

    logWarn("🚨 HARD RESET: This will DELETE ALL DATABASE TABLES!");
    logWarn("🚨 All data will be permanently lost!");
    logInfo("🔄 Starting hard reset process...");

    try {
        // Create database connection
        const sql = neon(env.DATABASE_URL);

        // Get all table names in the public schema
        logInfo("📋 Finding all tables in database...");
        const tablesResult = await sql`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        `;

        if (tablesResult.length === 0) {
            logInfo("✅ No tables found - database is already empty");
            return;
        }

        logInfo(
            `📊 Found ${tablesResult.length} tables to drop:`,
            tablesResult.map((t) => t.tablename).join(", "),
        );

        // Drop all tables with CASCADE to handle foreign key constraints
        for (const table of tablesResult) {
            const tableName = table.tablename;
            logInfo(`🗑️  Dropping table: ${tableName}`);

            // Use sql.query for dynamic identifiers
            await sql.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        }

        // Also drop any remaining sequences, views, etc.
        logInfo("🧹 Cleaning up sequences and views...");

        // Drop all sequences
        const sequencesResult = await sql`
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
        `;

        for (const sequence of sequencesResult) {
            await sql.query(`DROP SEQUENCE IF EXISTS "${sequence.sequence_name}" CASCADE`);
        }

        // Drop all views
        const viewsResult = await sql`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
        `;

        for (const view of viewsResult) {
            await sql.query(`DROP VIEW IF EXISTS "${view.table_name}" CASCADE`);
        }

        logInfo("✅ Hard reset completed successfully!");
        logInfo("🔄 Database is now completely empty");
        logInfo("⏭️  Next: Running db:push && db:seed...");
    } catch (error) {
        logError("❌ Hard reset failed:", error);
        throw error;
    }
}

// Run hard reset if this file is executed directly
if (require.main === module) {
    hardResetDatabase()
        .then(() => {
            logInfo("💥 Hard reset completed - ready for db:push && db:seed");
            process.exit(0);
        })
        .catch((error) => {
            logError("❌ Hard reset failed:", error);
            process.exit(1);
        });
}

export { hardResetDatabase };
