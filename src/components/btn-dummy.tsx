"use client";

import type { Session } from "next-auth";
import { logInfo } from "@/utils/sys/log";

type SessionLogButtonProps = {
    session: Session;
};

/**
 * Client Component for logging session data to console
 *
 * This component handles client-side interaction (onClick)
 * while receiving session data from the Server Component parent
 */
export default function SessionLogButton({ session }: SessionLogButtonProps) {
    const handleClick = () => {
        logInfo("Session:", session);
    };

    return (
        <button
            onClick={handleClick}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
            Log Session to Console
        </button>
    );
}
