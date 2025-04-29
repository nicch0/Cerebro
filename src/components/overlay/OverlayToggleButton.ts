import { CEREBRO_LUCIDE_ICON } from "@/constants";
import type Cerebro from "@/main";
import type Overlay from "@/views/Overlay";
import { Notice, setIcon } from "obsidian";

export const BUTTON_CLASS = "cerebro-overlay-button";

export default class OverlayToggleButton {
    private plugin: Cerebro;
    private overlay: Overlay;
    private containerEl: HTMLButtonElement;

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
        return this.containerEl.classList.contains("cerebro-overlay-button-active");
    }

    public set active(value: boolean) {
        this.containerEl.classList.toggle("cerebro-overlay-button-active", value);
    }

    public set pinned(value: boolean) {
        this.containerEl.classList.toggle("pinned", value);
    }

    public getContainerElement(): HTMLButtonElement {
        return this.containerEl;
    }

    private setupEventListeners(): void {
        this.plugin.registerDomEvent(this.containerEl, "click", () => this.handleClick());
    }

    private createElement(): HTMLButtonElement {
        const button: HTMLButtonElement = createEl("button", {
            cls: `clickable-icon view-action ${BUTTON_CLASS} hidden`,
            attr: {
                "aria-label": "Toggle Cerebro Overlay",
            },
        });
        setIcon(button, CEREBRO_LUCIDE_ICON);

        this.connectToDOM(button);

        return button;
    }

    private connectToDOM(button: HTMLButtonElement): void {
        // if (this.plugin.settings.outlinePosition === "right") {
        //     const viewActions: HTMLElement | null =
        //         this.overlay.view.containerEl.querySelector(".view-actions");
        //     viewActions?.insertBefore(button, viewActions?.firstChild);
        // } else if (this.plugin.settings.outlinePosition === "left") {
        //     const viewHeaderLeft: HTMLElement | null = this.overlay.view.containerEl.querySelector(
        //         ".view-header-left .view-header-nav-buttons",
        //     );
        //     viewHeaderLeft?.appendChild(button);
        // } else {
        //     console.error("Invalid window location: ", this.plugin.settings.outlinePosition);
        // }
        const viewActions: HTMLElement | null =
            this.overlay.view.containerEl.querySelector(".view-actions");
        viewActions?.insertBefore(button, viewActions?.firstChild);
    }

    private handleClick(): void {
        new Notice("Button clicked");
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
