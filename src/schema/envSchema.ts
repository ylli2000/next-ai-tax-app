import { z } from 'zod';

const envSchema = z.object({
    // Node environment - Using 'testing' instead of Jest's default 'test'
    NODE_ENV: z.enum(['development', 'testing', 'production']).default('development'),

    // Auth - NextAuth.js configuration
    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.string().url(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),

    // Database
    DATABASE_URL: z.string().min(1),

    // OpenAI API
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_ORGANIZATION_ID: z.string().optional(),

    // Email Service (Nodemailer)
    EMAIL_SERVER_HOST: z.string().optional(),
    EMAIL_SERVER_PORT: z.coerce.number().optional(),
    EMAIL_SERVER_USER: z.string().optional(),
    EMAIL_SERVER_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),

    // App Configuration
    NEXT_PUBLIC_APP_NAME: z.string().default('Invoice Manager'),
    NEXT_PUBLIC_APP_URL: z.string().url(),
});

/**
 * @type {Record<keyof z.infer<typeof envSchema>, string | undefined>}
 */
const processEnv = {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ORGANIZATION_ID: process.env.OPENAI_ORGANIZATION_ID,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

/**
 * Validate environment variables against the schema
 */
function validateEnv() {
    // Parse the environment variables
    const result = envSchema.safeParse(processEnv);

    // Log environment variables for debugging in non-production environment
    if (processEnv.NODE_ENV !== 'production') {
        console.info('🔍 Validating environment variables...');
        console.info('👉 processEnv:', processEnv);
    }

    if (!result.success) {
        console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
        throw new Error('Invalid environment variables:' + JSON.stringify(result.error.flatten().fieldErrors));
    }

    return result.data;
}

/**
 * Validated environment variables
 */
export const env = validateEnv();

export type Env = z.infer<typeof envSchema>; 