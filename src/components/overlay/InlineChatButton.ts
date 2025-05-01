import type Cerebro from "@/main";
import type Overlay from "@/views/Overlay.svelte";
import { Notice, setIcon } from "obsidian";

export const BUTTON_CLASS = "cerebro-inline-chat-button";

export default class InlineChatButton {
    private plugin: Cerebro;
    private overlay: Overlay;
    private containerEl: HTMLButtonElement;
    private selectedText: string | null = null;

    constructor(plugin: Cerebro, outline: Overlay) {
        this.plugin = plugin;
        this.overlay = outline;
        this.containerEl = this.createElement();
        this.setupEventListeners();
    }

    public get visible(): boolean {
        const isInDOM: boolean = this.containerEl.isConnected;
        const isHidden: boolean = this.containerEl.classList.contains("hidden");

        return isInDOM && !isHidden;
    }

    public set visible(value: boolean) {
        const isInDOM: boolean = this.containerEl.isConnected;
        if (!isInDOM) {
            this.connectToDOM(this.containerEl);
        }
        this.containerEl.classList.toggle("hidden", !value);
    }

    public get active(): boolean {
        return this.containerEl.classList.contains("button-active");
    }

    public set active(value: boolean) {
        this.containerEl.classList.toggle("button-active", value);
    }

    public getContainerElement(): HTMLButtonElement {
        return this.containerEl;
    }

    private setupEventListeners(): void {
        this.plugin.registerDomEvent(this.containerEl, "click", () => this.handleClick());
    }

    private createElement(): HTMLButtonElement {
        const button: HTMLButtonElement = createEl("button", {
            cls: `clickable-icon ${BUTTON_CLASS} hidden`,
            attr: {
                "aria-label": "Cerebro Inline Chat",
            },
        });
        setIcon(button, "plus");
        
        // Add to the CM editor container
        this.connectToDOM(button);
        return button;
    }

    private connectToDOM(button: HTMLButtonElement): void {
        // Add to the editor container instead of toolbar
        const editorContainer = this.overlay.view.containerEl.querySelector(".cm-editor");
        if (editorContainer) {
            // Ensure the button is positioned in the editor's relative coordinates
            editorContainer.appendChild(button);
            
            // Make sure the scroller container has position: relative
            // This is needed for absolute positioning to work correctly
            const cmScrollerElement = editorContainer.querySelector(".cm-scroller");
            if (cmScrollerElement && cmScrollerElement instanceof HTMLElement) {
                // Only set if not already relative, to avoid breaking other styling
                if (getComputedStyle(cmScrollerElement).position === "static") {
                    cmScrollerElement.style.position = "relative";
                }
            }
        }
    }

    public updatePosition(): void {
        this.connectToDOM(this.containerEl);
    }
    
    /**
     * Updates the button position based on the selection in the editor
     * 
     * @param position The offset position in the editor
     * @param selectedText The selected text
     */
    public updatePositionForSelection(position: number, selectedText: string): void {
        this.selectedText = selectedText;
        
        const editor = this.overlay.view.editor;
        if (!editor) return;
        
        // Get cursor position coordinates
        const editorPosition = editor.offsetToPos(position);
        const cmEditor = this.overlay.view.containerEl.querySelector(".cm-editor");
        
        if (!cmEditor) return;
        
        // Get the line element at the cursor position
        const lineIndex = editorPosition.line;
        const lineElements = cmEditor.querySelectorAll(".cm-line");
        
        if (lineIndex >= lineElements.length) return;
        
        const lineElement = lineElements[lineIndex];
        const lineRect = lineElement.getBoundingClientRect();
        
        // Get editor container dimensions
        const cmContentElement = cmEditor.querySelector(".cm-content");
        const cmScrollerElement = cmEditor.querySelector(".cm-scroller");
        const scrollerRect = cmScrollerElement?.getBoundingClientRect();
        const contentRect = cmContentElement?.getBoundingClientRect();
        
        if (!scrollerRect || !contentRect) return;
        
        // Calculate the vertical middle position of the line
        const lineMiddleY = lineRect.top - scrollerRect.top + (lineRect.height / 2);
        
        // Calculate right edge position - we want the button to be positioned
        // at the right edge of the content area
        const buttonSize = 24; // Size of the button in pixels
        const rightEdgePosition = contentRect.right - scrollerRect.left;
        
        // Position the button at the right edge of the content, vertically centered on the line
        this.containerEl.style.top = `${lineMiddleY - (buttonSize / 2)}px`;
        this.containerEl.style.left = `${rightEdgePosition}px`;
        this.containerEl.style.right = "auto"; // Clear right position if it was set
    }

    private handleClick(): void {
        if (this.selectedText) {
            new Notice(`Selected text: ${this.selectedText.substring(0, 20)}${this.selectedText.length > 20 ? '...' : ''}`);
            // TODO: Implement actual chat functionality with the selected text
        } else {
            new Notice("No text selected");
        }
    }

    public show(): void {
        if (this.visible) {
            return;
        }
        // Workaround because we have no view.onClose event to deactivate buttons properly.
        this.active = this.visible;
        this.visible = true;
    }

    public hide(): void {
        if (!this.visible) {
            return;
        }
        this.visible = false;
    }

    public destroy(): void {
        this.containerEl.remove();
    }
}
