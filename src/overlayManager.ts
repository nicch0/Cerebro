import type { MarkdownView, TFile } from "obsidian";
import { logger } from "./logger";
import type Cerebro from "./main";
import { createFileOverlayStore, type FileOverlayStore } from "./stores/overlay.svelte";
import Overlay from "./views/Overlay.svelte";

// Type definition for selection range
export interface SelectionRange {
    from: number;
    to: number;
}

export class OverlayManager {
    private plugin: Cerebro;
    public overlays: Map<string, Overlay>;
    private overlayStore: FileOverlayStore;

    constructor(plugin: Cerebro) {
        this.plugin = plugin;
        this.overlays = new Map();
        this.overlayStore = createFileOverlayStore();
    }

    public handleActiveLeafChange(view: MarkdownView) {
        this.updateOverlayVisibility(view);
    }

    public updateViewForOverlay(view: MarkdownView) {
        const overlay = this.getOverlayInView(view);
        overlay.view = view;
    }

    private updateOverlayVisibility(view: MarkdownView, isMetadataChange = false): void {
        const overlay: Overlay = this.getOverlayInView(view);

        // Update button visibility
        overlay.toggleButton(true);
    }

    private getViewId(view: MarkdownView): string {
        // @ts-ignore:2239
        return view.leaf.id;
    }

    /**
     * Gets or creates an overlay for a view,
     * associating it with the centralized store
     */
    private getOverlayInView(view: MarkdownView): Overlay {
        const viewId: string = this.getViewId(view);
        if (!this.overlays.has(viewId)) {
            this.overlays.set(viewId, new Overlay(this.plugin, view, this.overlayStore));
        }

        return this.overlays.get(viewId)!;
    }

    /**
     * Gets the store instance for direct access to file data
     */
    public getOverlayStore(): FileOverlayStore {
        return this.overlayStore;
    }

    /**
     * Handles file rename by updating the store
     */
    public handleFileRename(file: TFile, oldPath: string): void {
        // Get all comment threads from the old path
        const threads = this.overlayStore.getCommentThreads(oldPath);
        const wasActive = this.overlayStore.isOverlayActive(oldPath);

        // Clear old path data
        this.overlayStore.clearFileData(oldPath);

        // If there was data, recreate it at the new path
        if (threads.length > 0 || wasActive) {
            const newPath = file.path;

            // Set active state
            if (wasActive) {
                this.overlayStore.setOverlayActive(newPath, true);
            }

            // Recreate all comment threads
            for (const thread of threads) {
                const newThread = this.overlayStore.createCommentThread(
                    newPath,
                    thread.range,
                    thread.text,
                );

                // Copy all messages to the new thread
                for (const msg of thread.messages.messages) {
                    this.overlayStore.addMessageToThread(
                        newPath,
                        newThread.id,
                        msg.role,
                        msg.content,
                    );
                }
            }
        }
    }

    public getVisibleMDViews(): MarkdownView[] {
        const views: MarkdownView[] = this.plugin.app.workspace
            .getLeavesOfType("markdown")
            .map((leaf) => leaf.view as MarkdownView)
            .filter((view) => view.contentEl);
        return views;
    }

    public createButtonInView(view: MarkdownView): void {
        const overlay = this.getOverlayInView(view);
        if (!overlay.isButtonVisible) {
            overlay.showButton();
        }
    }

    public setUpViews(): void {
        const views: MarkdownView[] = this.getVisibleMDViews();
        if (views.length === 0) {
            return;
        }

        views
            .filter((view) => view.file)
            .forEach((view) => {
                this.createButtonInView(view);
            });
    }

    public removeAll(): void {
        this.overlays.forEach((overlay: Overlay) => {
            overlay.destroy();
        });
        this.overlays.clear();

        // Note: We don't clear the store data here since it should persist
        // across plugin reloads. Data will be saved/loaded from disk.
    }

    public isOverlayActiveForView(view: MarkdownView): boolean {
        if (!view.file) return false;

        // Get active state from the store first
        const filePath = view.file.path;
        const storeActive = this.overlayStore.isOverlayActive(filePath);

        // If the overlay isn't in our map yet, return the store state
        const viewId = this.getViewId(view);
        if (!this.overlays.has(viewId)) {
            return storeActive;
        }

        // Otherwise get the current state from the overlay instance
        const overlay = this.overlays.get(viewId)!;
        return overlay.active;
    }

    /**
     * Shows the inline chat button for a selection
     */
    public showInlineChatButtonForSelection(
        view: MarkdownView,
        selectedText: string,
        range: SelectionRange,
    ): void {
        const overlay = this.getOverlayInView(view);

        // Create a comment thread when button is clicked
        // Implementation to be added in the UI component
    }

    /**
     * Hides the inline chat button
     */
    public hideInlineChatButton(view: MarkdownView): void {
        // Implementation to be added
    }

    /**
     * Gets the path to the overlay data file
     */
    private getOverlayDataPath(): string {
        // Store in the plugin data folder
        return `${this.plugin.app.vault.configDir}/plugins/Cerebro/overlay-comments.json`;
    }

    /**
     * Saves overlay data to disk
     */
    public async saveOverlayData(): Promise<void> {
        try {
            // Get the data snapshot
            const snapshot = this.overlayStore.getStoreSnapshot();

            // Convert to JSON string
            const jsonData = JSON.stringify(snapshot, null, 2);

            // Make sure the directory exists
            const dataPath = this.getOverlayDataPath();
            const dirPath = dataPath.substring(0, dataPath.lastIndexOf("/"));

            // Create directory if it doesn't exist (using Obsidian's API)
            if (!(await this.plugin.app.vault.adapter.exists(dirPath))) {
                await this.plugin.app.vault.adapter.mkdir(dirPath);
            }

            // Write the file
            await this.plugin.app.vault.adapter.write(dataPath, jsonData);

            logger.debug(`[Cerebro] Successfully saved overlay data to ${dataPath}`);
        } catch (error) {
            logger.error(`[Cerebro] Failed to save overlay data: ${error}`);
            throw error;
        }
    }

    /**
     * Loads overlay data from disk
     */
    public async loadOverlayData(): Promise<void> {
        try {
            const dataPath = this.getOverlayDataPath();

            // Check if file exists
            if (await this.plugin.app.vault.adapter.exists(dataPath)) {
                // Read the file
                const jsonData = await this.plugin.app.vault.adapter.read(dataPath);

                // Parse JSON
                const snapshot = JSON.parse(jsonData);

                // Load data into store
                this.overlayStore.loadFromSnapshot(snapshot);
                logger.debug(
                    `[Cerebro] Successfully loaded overlay data from ${dataPath} with ${Object.keys(snapshot).length} file entries`,
                );
            } else {
                logger.debug("[Cerebro] No overlay data file found");
            }
        } catch (error) {
            logger.error(`[Cerebro] Failed to load overlay data: ${error}`);
            throw error;
        }
    }
}
