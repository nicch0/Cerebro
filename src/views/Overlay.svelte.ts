import OverlayToggleButton from "@/components/overlay/OverlayToggleButton";
import type Cerebro from "@/main";
import type { SelectionRange } from "@/overlayManager";
import type { FileOverlayStore } from "@/stores/overlay.svelte";
import { type MarkdownView } from "obsidian";
import { logger } from "@/logger";

export const CEREBRO_OVERLAY_VIEW = "cerebro-overlay-view";

export default class Overlay {
    private plugin: Cerebro;
    public view: MarkdownView;
    private toggleOverlayButton: OverlayToggleButton;
    private overlayStore: FileOverlayStore;
    
    // Local reactive state
    private overlayActive: boolean;

    constructor(plugin: Cerebro, view: MarkdownView, overlayStore: FileOverlayStore) {
        this.plugin = plugin;
        this.view = view;
        this.overlayStore = overlayStore;
        
        this.toggleOverlayButton = new OverlayToggleButton(this.plugin, this);

        // Initialize with the store's state or default to false
        const filePath = this.getFilePath();
        const storeActive = filePath ? this.overlayStore.isOverlayActive(filePath) : false;
        const overlayActive = $state(storeActive);
        this.overlayActive = overlayActive;
        
        this.setupEventListeners();
    }
    
    /**
     * Gets the current file path or null if view has no file
     */
    public getFilePath(): string | null {
        return this.view.file?.path || null;
    }

    public setupEventListeners(): void {
        // this.plugin.registerDomEvent(this.containerEl, "click", () => this.handleClick());
    }

    public get active(): boolean {
        // Local state is source of truth for UI, but we keep it synced with store
        return this.overlayActive;
    }

    public getViewType(): string {
        return CEREBRO_OVERLAY_VIEW;
    }

    public getDisplayText(): string {
        return "Cerebro Overlay";
    }

    public destroy(): void {
        this.button.destroy();
    }

    public get button(): OverlayToggleButton {
        return this.toggleOverlayButton;
    }

    public get isButtonVisible(): boolean {
        return this.toggleOverlayButton.visible;
    }

    public set buttonActive(value: boolean) {
        this.toggleOverlayButton.active = value;
    }

    public set buttonPinned(value: boolean) {
        this.toggleOverlayButton.pinned = value;
    }

    public toggle(): void {
        const filePath = this.getFilePath();
        if (!filePath) {
            logger.debug("[Cerebro] Cannot toggle overlay for view without file");
            return;
        }
        
        // Update the store - this will trigger reactivity through the get bindings
        const newActiveState = this.overlayStore.toggleOverlayActive(filePath);
        
        // Also update our local state and UI directly for immediate visual feedback
        this.overlayActive = newActiveState;
        this.buttonPinned = newActiveState;
        this.buttonActive = newActiveState;
        
        // This access of lastOperationTime ensures reactivity tracking
        // Any component that is using the store will update when this changes
        const _forReactivity = this.overlayStore.lastOperationTime;
    }

    public toggleButton(value: boolean): void {
        value ? this.showButton() : this.hideButton();
    }

    public showButton(): void {
        if (!this.isButtonVisible) {
            this.toggleOverlayButton.show();
        }
    }

    public hideButton(): void {
        if (this.isButtonVisible) {
            this.toggleOverlayButton.hide();
        }
    }
    
    /**
     * Creates a comment thread for the current selection
     */
    public createCommentThread(range: SelectionRange, text: string): void {
        const filePath = this.getFilePath();
        if (!filePath) {
            logger.debug("[Cerebro] Cannot create comment thread for view without file");
            return;
        }
        
        this.overlayStore.createCommentThread(filePath, range, text);
    }
    
    /**
     * Gets all comment threads for the current file
     */
    public getCommentThreads() {
        const filePath = this.getFilePath();
        if (!filePath) return [];
        
        return this.overlayStore.getCommentThreads(filePath);
    }
}
