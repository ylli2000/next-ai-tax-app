/* eslint-disable no-console */
export type Logger = {
    [K in LogLevel]: (msg: string, data?: unknown) => void;
};

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LoggerOptions = {
    level?: LogLevel;
    prefix?: string;
    output?: "console" | "remote";
    remoteUrl?: string;
};

export const defaultOptions: Required<LoggerOptions> = {
    level: "info",
    prefix: "",
    output: "console",
    remoteUrl: "",
};

export const levels: LogLevel[] = ["debug", "info", "warn", "error"];

export const createCustomLogger = (options: LoggerOptions = {}): Logger => {
    const { level, prefix, output, remoteUrl } = {
        ...defaultOptions,
        ...options,
    };

    //debug and info are logged in development, but not in production
    const shouldLog = (msgLevel: LogLevel): boolean =>
        (process.env.NODE_ENV === "development" &&
            (msgLevel === "debug" || msgLevel === "info")) ||
        levels.indexOf(msgLevel) >= levels.indexOf(level);

    const logToConsole = (
        msgLevel: LogLevel,
        message: string,
        data?: unknown,
    ) => {
        const tag = prefix ? `[${prefix}]` : "";
        if (data !== undefined) {
            console[msgLevel](`${tag}`, message, data);
        } else {
            console[msgLevel](`${tag}`, message);
        }
    };

    const logToRemote = async (
        msgLevel: LogLevel,
        message: string,
        data?: unknown,
    ) => {
        if (!remoteUrl) return;
        await fetch(remoteUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                level: msgLevel,
                message,
                data: data || undefined,
                timestamp: new Date().toISOString(),
            }),
        });
    };

    const handleLog = (msgLevel: LogLevel, message: string, data?: unknown) => {
        if (!shouldLog(msgLevel)) return;
        if (output === "console") logToConsole(msgLevel, message, data);
        else logToRemote(msgLevel, message, data);
    };

    return {
        debug: (msg: string, data?: unknown) => handleLog("debug", msg, data),
        info: (msg: string, data?: unknown) => handleLog("info", msg, data),
        warn: (msg: string, data?: unknown) => handleLog("warn", msg, data),
        error: (msg: string, data?: unknown) => handleLog("error", msg, data),
    };
};

export const defaultLogger = createCustomLogger(defaultOptions);

export const logInfo = (message: string, data?: unknown) =>
    defaultLogger.info(message, data);

export const logError = (message: string, error?: unknown) =>
    defaultLogger.error(message, error);

export const logWarn = (message: string, data?: unknown) =>
    defaultLogger.warn(message, data);

export const logDebug = (message: string, data?: unknown) =>
    defaultLogger.debug(message, data || "");

//Redundant context provider

// LoggerContext.tsx
// import React, { createContext, useContext, useMemo } from 'react';
// import { createCustomLogger, LoggerOptions } from './Logger';

// const LoggerContext = createContext<ReturnType<typeof createCustomLogger> | null>(null);

// export const LoggerProvider: React.FC<{ options?: LoggerOptions; children: React.ReactNode }> = ({ options, children }) => {
//   const logger = useMemo(() => createCustomLogger(options), [JSON.stringify(options)]);
//   return <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>;
// };

// export const useLogger = () => {
//   const logger = useContext(LoggerContext);
//   if (!logger) throw new Error('useLogger must be used within a LoggerProvider');
//   return logger;
// };
