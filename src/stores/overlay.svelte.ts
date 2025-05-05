import type { EditorRange } from "obsidian";
import { SvelteMap } from "svelte/reactivity";
import { createMessageStore, type MessageStore } from "./messages.svelte";

export type FilePath = string;

export type InlineConversation = {
    id: number;
    editorRange: EditorRange;
    messageStore: MessageStore;
    selectedText: string;
};
const createOverlayDataStore = () => {
    const data = $state({
        active: true,
        conversations: [] as InlineConversation[],
    });
    let currentId = 0;
    return {
        get data() {
            return data;
        },
        addInlineConversation: (editorRange: EditorRange, selectedText: string): void => {
            data.conversations.push({
                id: currentId,
                editorRange,
                messageStore: createMessageStore(),
                selectedText,
            });
            currentId += 1;
        },
        removeConversation: (id: number): void => {
            data.conversations = data.conversations.filter(
                (conversation) => conversation.id !== id,
            );
        },
        toggleActive: (): void => {
            data.active = !data.active;
        },
    };
};

export type OverlayDataStore = ReturnType<typeof createOverlayDataStore>;

/**
 * Creates a file overlay store with reactive state for managing
 * overlay data across multiple views of the same file
 */
export const createFileOverlayStore = () => {
    const overlayData: SvelteMap<FilePath, OverlayDataStore> = new SvelteMap();

    return {
        // Read methods using get bindings for reactivity
        getOverlayData: (filePath: FilePath): OverlayDataStore => {
            if (!overlayData.has(filePath)) {
                const data = createOverlayDataStore();
                overlayData.set(filePath, data);
            }
            return overlayData.get(filePath)!;
        },
    };
};

// Export the type for use in components
export type FileOverlayStore = ReturnType<typeof createFileOverlayStore>;
