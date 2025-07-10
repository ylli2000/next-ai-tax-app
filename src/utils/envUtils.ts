import { type Env, envSchema, processEnv } from "@/schema/envSchema";
import { logError, logInfo } from "@/utils/logUtils";

/**
 * Validate environment variables against the schema
 */
let __env: Env | null = null;
function validateEnv(): Env {
    if (__env) return __env; //singleton

    // Parse the environment variables
    const result = envSchema.safeParse(processEnv);

    logInfo(
        `\n 🔍 Validating environment variables...(${processEnv.NODE_ENV} mode)`,
    );
    if (processEnv.NODE_ENV !== "production") {
        //in development, log the processEnv to console
        logInfo("👉 processEnv:", processEnv);
    } else {
        //loop through processEnv and log the keys and check if values are defined
        Object.keys(processEnv).forEach((key) => {
            if (processEnv[key as keyof typeof processEnv] === undefined)
                logError(`❌ ${key} is not defined`);
            else logInfo(`✅ ${key} is defined`);
        });
    }
    if (!result.success) {
        logError(
            "❌ Invalid environment variables:",
            result.error.flatten().fieldErrors,
        );
        throw new Error(
            "Invalid environment variables:" +
                JSON.stringify(result.error.flatten().fieldErrors),
        );
    }
    __env = result.data;
    return __env;
}

/**
 * Validated environment variables
 */
logInfo("💬 Starting validation from envUtils...");
export const env = validateEnv();
