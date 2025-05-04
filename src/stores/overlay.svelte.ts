import { logger } from "@/logger";
import type { SelectionRange } from "@/overlayManager";
import type { MessageContent } from "@/types";
import { createMessageStore, type MessageStore } from "./messages.svelte";

export type CommentThread = {
    id: string;
    range: SelectionRange;
    text: string;
    messages: MessageStore;
};

export type FileOverlayData = {
    active: boolean;
    commentThreads: CommentThread[];
};

export type FilePath = string;

/**
 * Creates a file overlay store with reactive state for managing
 * overlay data across multiple views of the same file
 */
export const createFileOverlayStore = () => {
    // Map of file paths to their data using $state for reactivity
    const fileData = $state(new Map<FilePath, FileOverlayData>());
    const storeOperations = $state({
        lastOperationTime: Date.now(),
    });

    /**
     * Gets or creates the overlay data for a file path
     */
    function getOrCreateFileData(filePath: FilePath): FileOverlayData {
        if (!fileData.has(filePath)) {
            fileData.set(filePath, {
                active: false,
                commentThreads: [],
            });
        }
        return fileData.get(filePath)!;
    }

    /**
     * Overlay active
     */
    function toggleOverlayActive(filePath: FilePath): boolean {
        const data = getOrCreateFileData(filePath);
        data.active = !data.active;
        storeOperations.lastOperationTime = Date.now();
        return data.active;
    }

    function setOverlayActive(filePath: FilePath, active: boolean): void {
        const data = getOrCreateFileData(filePath);
        data.active = active;
        storeOperations.lastOperationTime = Date.now();
    }

    function isOverlayActive(filePath: FilePath): boolean {
        if (!fileData.has(filePath)) return false;
        return fileData.get(filePath)!.active;
    }

    /**
     * Creates a new comment thread for the specified file and selection
     */
    function createCommentThread(
        filePath: FilePath,
        range: SelectionRange,
        text: string,
    ): CommentThread {
        const data = getOrCreateFileData(filePath);
        const id = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const thread: CommentThread = {
            id,
            range,
            text,
            messages: createMessageStore(),
        };

        data.commentThreads.push(thread);
        storeOperations.lastOperationTime = Date.now();
        logger.debug(`[Cerebro] Created new comment thread for ${filePath}`);
        return thread;
    }

    /**
     * Gets all comment threads for a file
     */
    function getCommentThreads(filePath: FilePath): CommentThread[] {
        if (!fileData.has(filePath)) return [];
        return fileData.get(filePath)!.commentThreads;
    }

    /**
     * Gets a specific comment thread by ID
     */
    function getCommentThreadById(filePath: FilePath, threadId: string): CommentThread | undefined {
        if (!fileData.has(filePath)) return undefined;
        return fileData.get(filePath)!.commentThreads.find((t) => t.id === threadId);
    }

    /**
     * Adds a message to a comment thread
     */
    function addMessageToThread(
        filePath: FilePath,
        threadId: string,
        role: string,
        content: MessageContent,
    ): void {
        const thread = getCommentThreadById(filePath, threadId);
        if (thread) {
            thread.messages.addMessage(role, content);
            storeOperations.lastOperationTime = Date.now();
            logger.debug(`[Cerebro] Added message to thread ${threadId} in ${filePath}`);
        }
    }

    /**
     * Deletes a comment thread
     */
    function deleteCommentThread(filePath: FilePath, threadId: string): boolean {
        if (!fileData.has(filePath)) return false;

        const data = fileData.get(filePath)!;
        const initialLength = data.commentThreads.length;

        data.commentThreads = data.commentThreads.filter((t) => t.id !== threadId);

        const deleted = initialLength > data.commentThreads.length;
        if (deleted) {
            storeOperations.lastOperationTime = Date.now();
            logger.debug(`[Cerebro] Deleted comment thread ${threadId} from ${filePath}`);
        }

        return deleted;
    }

    /**
     * Clears all data for a file
     */
    function clearFileData(filePath: FilePath): void {
        fileData.delete(filePath);
        storeOperations.lastOperationTime = Date.now();
        logger.debug(`[Cerebro] Cleared overlay data for ${filePath}`);
    }

    /**
     * Gets all file paths with overlay data
     */
    function getAllFilePaths(): string[] {
        return Array.from(fileData.keys());
    }

    // For serialization/persistence
    function getStoreSnapshot(): Record<FilePath, FileOverlayData> {
        const snapshot: Record<FilePath, FileOverlayData> = {};
        fileData.forEach((data, path) => {
            snapshot[path] = data;
        });
        return snapshot;
    }

    function loadFromSnapshot(snapshot: Record<FilePath, FileOverlayData>): void {
        // Clear existing data
        fileData.clear();

        // Load from snapshot
        Object.entries(snapshot).forEach(([path, data]) => {
            fileData.set(path, data);
        });

        storeOperations.lastOperationTime = Date.now();
        logger.debug(`[Cerebro] Loaded overlay data from snapshot`);
    }

    return {
        // Read methods using get bindings for reactivity
        get fileData() {
            return fileData;
        },
        get operations() {
            return storeOperations;
        },

        // Access methods for specific data
        getOrCreateFileData,
        isOverlayActive,
        getCommentThreads,
        getCommentThreadById,
        getAllFilePaths,
        getStoreSnapshot,

        // Write methods
        toggleOverlayActive,
        setOverlayActive,
        createCommentThread,
        addMessageToThread,
        deleteCommentThread,
        clearFileData,
        loadFromSnapshot,

        // For reactivity tracking with get
        get lastOperationTime() {
            return storeOperations.lastOperationTime;
        },
    };
};

// Export the type for use in components
export type FileOverlayStore = ReturnType<typeof createFileOverlayStore>;
