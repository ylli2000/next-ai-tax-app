/* eslint-disable no-console */

export const logInfo = (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data || "");
};

export const logError = (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
};

export const logWarn = (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data || "");
};

export const logDebug = (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
        console.debug(`[DEBUG] ${message}`, data || "");
    }
};
