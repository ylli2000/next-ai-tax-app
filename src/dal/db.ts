import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../schema/envSchema';
import * as userTables from '../schema/userTables';
import * as invoiceTables from '../schema/invoiceTables';

// Combine all table schemas
const schema = { ...userTables, ...invoiceTables };

// Create the connection
const sql = neon(env.DATABASE_URL);

// Create the database instance
export const db = drizzle(sql, { schema });

// Export types
export type Database = typeof db; 