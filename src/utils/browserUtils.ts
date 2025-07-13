import { ERROR_MESSAGES } from "@/schema/messageSchema";
import { UPLOAD_CONSTANTS } from "@/schema/uploadSchema";
import { logError } from "./logUtils";

/**
 * Browser compatibility and DOM manipulation utilities
 * Handles feature detection, file input creation, and browser-specific operations
 */

// ===== Browser Feature Detection =====

/**
 * Check if browser supports file reading
 */
export const supportsFileReader = (): boolean =>
    typeof FileReader !== "undefined";

/**
 * Check if browser supports drag and drop
 */
export const supportsDragAndDrop = (): boolean => {
    const div = document.createElement("div");
    return "draggable" in div || ("ondragstart" in div && "ondrop" in div);
};

/**
 * Check if browser supports HTML5 Canvas
 */
export const supportsCanvas = (): boolean => {
    try {
        const canvas = document.createElement("canvas");
        return !!(canvas.getContext && canvas.getContext("2d"));
    } catch {
        return false;
    }
};

/**
 * Check if browser supports Web Workers
 */
export const supportsWebWorkers = (): boolean => typeof Worker !== "undefined";

/**
 * Check if browser supports File API
 */
export const supportsFileAPI = (): boolean =>
    typeof File !== "undefined" && typeof FileList !== "undefined";

// ===== DOM Operations =====

/**
 * Create file input element for upload interface
 */
export const createFileInput = (
    options: {
        accept?: string;
        multiple?: boolean;
        onChange?: (files: File[]) => void;
    } = {},
): HTMLInputElement => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
        options.accept || UPLOAD_CONSTANTS.DEFAULT_ALLOWED_TYPES_STRING;
    input.multiple = options.multiple || false;
    input.style.display = "none";

    if (options.onChange) {
        input.addEventListener("change", async () => {
            try {
                const files = await readFileFromInput(input);
                options.onChange!(files);
            } catch (error) {
                logError("Error reading files:", error);
            }
        });
    }

    return input;
};

/**
 * Read file from input element
 */
export const readFileFromInput = async (
    input: HTMLInputElement,
): Promise<File[]> =>
    new Promise((resolve, reject) => {
        if (!input.files) {
            reject(new Error(ERROR_MESSAGES.NO_FILES_SELECTED));
            return;
        }

        const files = Array.from(input.files);
        resolve(files);
    });

/**
 * Trigger file selection dialog
 */
export const selectFiles = (
    options: {
        accept?: string;
        multiple?: boolean;
    } = {},
): Promise<File[]> =>
    new Promise((resolve, reject) => {
        const input = createFileInput({
            ...options,
            onChange: (files) => resolve(files),
        });

        // Add to DOM temporarily
        document.body.appendChild(input);
        input.click();

        // Clean up after selection
        setTimeout(() => {
            if (document.body.contains(input)) {
                document.body.removeChild(input);
            }
        }, 1000);

        // Handle cancel (no files selected)
        input.addEventListener("cancel", () => {
            reject(new Error(ERROR_MESSAGES.FILE_SELECTION_CANCELLED));
        });
    });

// ===== Drag and Drop Utilities =====

/**
 * Setup drag and drop for file upload
 */
export const setupDragAndDrop = (
    element: HTMLElement,
    onFilesDropped: (files: File[]) => void,
    onDragStateChange?: (isDragging: boolean) => void,
): void => {
    if (!supportsDragAndDrop()) {
        logError("Drag and drop not supported in this browser");
        return;
    }

    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        dragCounter++;
        onDragStateChange?.(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            onDragStateChange?.(false);
        }
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        dragCounter = 0;
        onDragStateChange?.(false);

        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length > 0) {
            onFilesDropped(files);
        }
    };

    element.addEventListener("dragenter", handleDragEnter);
    element.addEventListener("dragleave", handleDragLeave);
    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("drop", handleDrop);
};

/**
 * Remove drag and drop event listeners
 */
export const removeDragAndDrop = (element: HTMLElement): void => {
    element.removeEventListener("dragenter", () => {});
    element.removeEventListener("dragleave", () => {});
    element.removeEventListener("dragover", () => {});
    element.removeEventListener("drop", () => {});
};

// ===== Browser Information =====

/**
 * Get browser information for debugging
 */
export const getBrowserInfo = () => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    onLine: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    fileAPI: supportsFileAPI(),
    dragAndDrop: supportsDragAndDrop(),
    fileReader: supportsFileReader(),
    canvas: supportsCanvas(),
    webWorkers: supportsWebWorkers(),
});

/**
 * Check if browser is mobile
 */
export const isMobileBrowser = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
        userAgent,
    );
};

/**
 * Check if browser is Safari
 */
export const isSafari = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes("safari") && !userAgent.includes("chrome");
};

/**
 * Check if browser is iOS
 */
export const isIOS = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

// ===== File System Access API (Chrome) =====

/**
 * Check if browser supports File System Access API
 */
export const supportsFileSystemAccess = (): boolean =>
    "showOpenFilePicker" in window;

/**
 * Open file picker using File System Access API (Chrome)
 * Falls back to regular input if not supported
 */
export const openFilePickerNative = async (
    options: {
        accept?: Record<string, string[]>;
        multiple?: boolean;
    } = {},
): Promise<File[]> => {
    if (supportsFileSystemAccess()) {
        try {
            // @ts-expect-error - File System Access API
            const fileHandles = await window.showOpenFilePicker({
                types: options.accept
                    ? [
                          {
                              description: "Supported files",
                              accept: options.accept,
                          },
                      ]
                    : undefined,
                multiple: options.multiple || false,
            });

            const files = await Promise.all(
                fileHandles.map((handle: FileSystemFileHandle) =>
                    handle.getFile(),
                ),
            );
            return files;
        } catch (error) {
            // User cancelled or error occurred
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error(ERROR_MESSAGES.FILE_SELECTION_CANCELLED);
            }
            throw error;
        }
    } else {
        // Fallback to regular file input
        return selectFiles({
            accept: options.accept
                ? Object.values(options.accept).flat().join(",")
                : undefined,
            multiple: options.multiple,
        });
    }
};
