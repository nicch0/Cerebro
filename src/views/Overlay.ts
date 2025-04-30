import { type MarkdownView } from "obsidian";
import OverlayToggleButton from "@/components/overlay/OverlayToggleButton";
import type Cerebro from "@/main";

export const CEREBRO_OVERLAY_VIEW = "cerebro-overlay-view";

export default class Overlay {
    private plugin: Cerebro;
    public view: MarkdownView;
    private toggleOverlayButton: OverlayToggleButton;

    constructor(plugin: Cerebro, view: MarkdownView) {
        this.plugin = plugin;
        this.view = view;
        this.toggleOverlayButton = new OverlayToggleButton(this.plugin, this);
    }

    getViewType(): string {
        return CEREBRO_OVERLAY_VIEW;
    }
    getDisplayText(): string {
        return "Cerebro Overlay";
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
}
