import { defineConfig } from 'drizzle-kit';
import { env } from './src/schema/envSchema';

export default defineConfig({
    schema: './src/schema/*',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
}); 