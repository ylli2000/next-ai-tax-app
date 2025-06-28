import { defineConfig } from 'drizzle-kit';
import { env } from './src/types/envSchema';

export default defineConfig({
    schema: './src/dal/schema/*',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
}); 