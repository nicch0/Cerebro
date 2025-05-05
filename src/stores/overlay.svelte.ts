import { SvelteMap } from "svelte/reactivity";
import type { MessageStore } from "./messages.svelte";

export type FilePath = string;

const createOverlayDataStore = () => {
    const data = $state({ active: true, messageStores: [] });
    return {
        get data() {
            return data;
        },
        addMessageStore: (messageStore: MessageStore): void => {
            data.messageStores.push(messageStore);
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
