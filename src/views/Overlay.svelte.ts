import OverlayToggleButton from "@/components/overlay/OverlayToggleButton";
import type Cerebro from "@/main";
import { type MarkdownView } from "obsidian";

export const CEREBRO_OVERLAY_VIEW = "cerebro-overlay-view";

export default class Overlay {
    private plugin: Cerebro;
    public view: MarkdownView;
    private toggleOverlayButton: OverlayToggleButton;
    private overlayActive: boolean;

    constructor(plugin: Cerebro, view: MarkdownView) {
        this.plugin = plugin;
        this.view = view;
        this.toggleOverlayButton = new OverlayToggleButton(this.plugin, this);

        // TODO: Set default behaviour based on settings
        const overlayActive = $state(false);
        this.overlayActive = overlayActive;
        this.setupEventListeners();
    }

    public setupEventListeners(): void {
        // this.plugin.registerDomEvent(this.containerEl, "click", () => this.handleClick());
    }

    public get active(): boolean {
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
        this.overlayActive = !this.overlayActive;
        this.buttonPinned = this.overlayActive;
        this.buttonActive = this.overlayActive;
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
