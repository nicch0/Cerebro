import InlineChatButton from "@/components/overlay/InlineChatButton";
import OverlayToggleButton from "@/components/overlay/OverlayToggleButton";
import type Cerebro from "@/main";
import type { SelectionRange } from "@/overlayManager";
import { type MarkdownView } from "obsidian";

export const CEREBRO_OVERLAY_VIEW = "cerebro-overlay-view";

export default class Overlay {
    private plugin: Cerebro;
    public view: MarkdownView;
    private toggleOverlayButton: OverlayToggleButton;
    public inlineChatButton: InlineChatButton;
    private overlayActive: boolean;
    private selectedText: string | null = null;
    private selectionRange: SelectionRange | null = null;

    constructor(plugin: Cerebro, view: MarkdownView) {
        this.plugin = plugin;
        this.view = view;
        this.toggleOverlayButton = new OverlayToggleButton(this.plugin, this);
        this.inlineChatButton = new InlineChatButton(this.plugin, this);
        // TODO: Set default behaviour based on settings
        const overlayActive = $state(false);
        this.overlayActive = overlayActive;
        this.setupEventListeners();
    }

    public setupEventListeners(): void {
        // this.plugin.registerDomEvent(this.containerEl, "click", () => this.handleClick());
    }

    public getViewType(): string {
        return CEREBRO_OVERLAY_VIEW;
    }

    public getDisplayText(): string {
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

    /**
     * Shows the inline chat button at the text selection position
     *
     * @param selectedText The text that was selected
     * @param range The range of the selection in the editor
     */
    public showInlineChatButton(selectedText: string, range: SelectionRange): void {
        // Store the selected text and range
        this.selectedText = selectedText;
        this.selectionRange = range;

        // Get the editor view
        const editor = this.view.editor;
        if (!editor) return;

        // Position the button at the end of the selection
        // Convert the position to screen coordinates
        const endPos = editor.posToOffset(editor.offsetToPos(range.to));

        // Update the inline chat button and show it
        this.inlineChatButton.updatePositionForSelection(endPos, selectedText);
        this.inlineChatButton.show();
    }

    /**
     * Hides the inline chat button
     */
    public hideInlineChatButton(): void {
        this.inlineChatButton.hide();
        this.selectedText = null;
        this.selectionRange = null;
    }
}
