import { SvelteMap } from "svelte/reactivity";

// export type FileOverlayData = {
//     active: boolean;
//     commentThreads: CommentThread[];
// };

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

export type FileOverlayData = ReturnType<typeof createOverlayData>;

/**
 * Creates a file overlay store with reactive state for managing
 * overlay data across multiple views of the same file
 */
export const createFileOverlayStore = () => {
    const fileData: SvelteMap<FilePath, FileOverlayData> = new SvelteMap();

    return {
        // Read methods using get bindings for reactivity
        getFileData: (filePath: FilePath): FileOverlayData => {
            if (!fileData.has(filePath)) {
                const data = createOverlayData();
                fileData.set(filePath, data);
            }
            return fileData.get(filePath)!;
        },
    };
};

// Export the type for use in components
export type FileOverlayStore = ReturnType<typeof createFileOverlayStore>;
