import { SvelteMap } from "svelte/reactivity";

export type FilePath = string;

const createOverlayData = () => {
    const data = $state({ active: false });
    return {
        get data() {
            return data;
        },
        toggleActive: (): void => {
            data.active = !data.active;
        },
    };
};

export type OverlayData = ReturnType<typeof createOverlayData>;

/**
 * Creates a file overlay store with reactive state for managing
 * overlay data across multiple views of the same file
 */
export const createFileOverlayStore = () => {
    const overlayData: SvelteMap<FilePath, OverlayData> = new SvelteMap();

    return {
        // Read methods using get bindings for reactivity
        getOverlayData: (filePath: FilePath): OverlayData => {
            if (!overlayData.has(filePath)) {
                const data = createOverlayData();
                overlayData.set(filePath, data);
            }
            return overlayData.get(filePath)!;
        },
    };
};

// Export the type for use in components
export type FileOverlayStore = ReturnType<typeof createFileOverlayStore>;
