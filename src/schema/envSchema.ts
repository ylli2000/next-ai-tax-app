import { z } from "zod";

// Environment-specific constants
export const ENV_CONSTANTS = {
    IS_DEVELOPMENT: process.env.NODE_ENV === "development", // Used for dev-only features and debug logging
    IS_PRODUCTION: process.env.NODE_ENV === "production", // Used for production optimizations and error handling
    IS_TEST: process.env.NODE_ENV === "test", // Used in test configurations and mock data
} as const;

export const NodeEnvEnum = ["development", "testing", "production"] as const;
export const envSchema = z.object({
    // Node environment - Using 'testing' instead of Jest's default 'test'
    NODE_ENV: z.enum(NodeEnvEnum).default("development"),

    // Auth - NextAuth.js configuration
    AUTH_SECRET: z.string().min(1).default(""),
    AUTH_URL: z.string().url().default(""),
    AUTH_GOOGLE_ID: z.string().default(""),
    AUTH_GOOGLE_SECRET: z.string().default(""),
    AUTH_GITHUB_ID: z.string().default(""),
    AUTH_GITHUB_SECRET: z.string().default(""),

    // Database
    DATABASE_URL: z.string().min(1).default(""),

    // OpenAI API
    OPENAI_API_KEY: z.string().min(1).default(""),
    OPENAI_ORGANIZATION_ID: z.string().default(""),

    // Email Service (Nodemailer)
    EMAIL_SERVER_HOST: z.string().default(""),
    EMAIL_SERVER_PORT: z.coerce.number().default(0),
    EMAIL_SERVER_USER: z.string().default(""),
    EMAIL_SERVER_PASSWORD: z.string().default(""),
    EMAIL_FROM: z.string().email().default(""),

    // App Configuration
    NEXT_PUBLIC_APP_NAME: z.string().default(""),
    NEXT_PUBLIC_APP_URL: z.string().url().default(""),
});

/**
 * @type {Record<keyof z.infer<typeof envSchema>, string | undefined>}
 */
export const processEnv = {
    NODE_ENV: process.env.NODE_ENV || "development",

    // NextAuth.js - Generate with: openssl rand -base64 32
    // Example: "abc123def456ghi789jkl012mno345pqr678="
    AUTH_SECRET: process.env.AUTH_SECRET,

    // NextAuth.js - Your app URL for callbacks
    // Example: "https://yourapp.vercel.app" or "http://localhost:3000"
    AUTH_URL: process.env.AUTH_URL,

    // Google OAuth - From Google Cloud Console > APIs & Services > Credentials
    // Example: "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,

    // Google OAuth - Client secret from Google Cloud Console
    // Example: "GOCSPX-abcdefghijklmnopqrstuvwxyz123456"
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,

    // GitHub OAuth - From GitHub Settings > Developer settings > OAuth Apps
    // Example: "Iv1.1234567890abcdef"
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,

    // GitHub OAuth - Client secret from GitHub OAuth App
    // Example: "abcdef1234567890abcdef1234567890abcdef12"
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,

    // PostgreSQL - From Vercel Storage or Neon.tech
    // Example: "postgresql://user:password@host:5432/database?sslmode=require"
    DATABASE_URL: process.env.DATABASE_URL,

    // OpenAI - From OpenAI Platform > API Keys
    // Example: "sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQR"
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    // OpenAI - From OpenAI Platform > Settings > Organization ID (optional)
    // Example: "org-abcdefghijklmnopqrstuvwx"
    OPENAI_ORGANIZATION_ID: process.env.OPENAI_ORGANIZATION_ID,

    // Email SMTP - From Gmail, Outlook, or SendGrid
    // Example: "smtp.gmail.com" or "smtp-mail.outlook.com"
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,

    // Email SMTP Port - Usually 587 for TLS or 465 for SSL
    // Example: 587
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,

    // Email SMTP - Your email address or SMTP username
    // Example: "your-email@gmail.com"
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,

    // Email SMTP - Your email password or app-specific password
    // Example: "your-app-password-from-gmail"
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,

    // Email From Address - Sender email address
    // Example: "noreply@yourapp.com"
    EMAIL_FROM: process.env.EMAIL_FROM,

    // App Name - Public app name for branding
    // Example: "AI Invoice Manager"
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,

    // App URL - Public app URL for links and redirects
    // Example: "https://yourapp.vercel.app"
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

export type Env = z.infer<typeof envSchema>;

export const env: Env = (() => {
    const result = envSchema.safeParse(processEnv);
    if (!result.success)
        throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    return result.data;
})();
