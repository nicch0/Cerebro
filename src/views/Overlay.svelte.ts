import { type MarkdownView } from "obsidian";
import { mount, unmount } from "svelte";
import OverlayToggleButton from "@/components/overlay/OverlayToggleButton.svelte";
import type Cerebro from "@/main";
import type { OverlayData } from "@/stores/overlay.svelte";

export const CEREBRO_OVERLAY_VIEW = "cerebro-overlay-view";

export default class Overlay {
    private plugin: Cerebro;
    public view: MarkdownView;
    private overlayToggleButton: ReturnType<typeof OverlayToggleButton> | undefined;
    private overlayData: OverlayData;

    constructor(plugin: Cerebro, view: MarkdownView, overlayData: OverlayData) {
        this.plugin = plugin;
        this.view = view;
        this.overlayData = overlayData;
        this.mountComponents();

        // Initialize with the store's state or default to false
        this.setupEventListeners();
    }

    public mountComponents(): void {
        // TODO: Support RHS

        const viewActions: HTMLElement | null =
            this.view.containerEl.querySelector(".view-actions");

        if (viewActions) {
            this.overlayToggleButton = mount(OverlayToggleButton, {
                target: viewActions,
                anchor: viewActions?.firstChild || undefined,
                props: {
                    data: this.overlayData.data,
                    toggleActive: this.overlayData.toggleActive,
                },
            });
        }
    }

    public setupEventListeners(): void {}

    public getViewType(): string {
        return CEREBRO_OVERLAY_VIEW;
    }

    public getDisplayText(): string {
        return "Cerebro Overlay";
    }

    public destroy(): void {
        if (this.overlayToggleButton) {
            unmount(this.overlayToggleButton);
        }
    }
}
