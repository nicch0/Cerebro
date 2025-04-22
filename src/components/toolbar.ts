import ChatInterface from "../chatInterface";
import { CEREBRO_CHAT_ID } from "../commands/chat";
import Cerebro from "../main";
import { MarkdownView, setIcon } from "obsidian";

const ARROW_UP_ICON = "arrow-up";

export default class ChatToolbar {
    private _chatInterface: ChatInterface;
    private _plugin: Cerebro;
    private _containerEl: HTMLDivElement;

    constructor(plugin: Cerebro, chatInterface: ChatInterface) {
        this._plugin = plugin;
        this._chatInterface = chatInterface;
        this._containerEl = this.createElement();
        // this._setupEventListeners();
    }

   	get visible(): boolean {
		const isInDOM: boolean = this._containerEl.isConnected;
		const isHidden: boolean =
			this._containerEl.classList.contains("hidden");

		return isInDOM && !isHidden;
	}

	set visible(value: boolean) {
		const isInDOM: boolean = this._containerEl.isConnected;
		if (!isInDOM) {
			this._connectToDOM(this._containerEl);
		}
		this._containerEl.classList.toggle("hidden", !value);
	}

    private createElement(): HTMLDivElement {
        const toolbarEl = createEl("div", {
            cls: ["cerebro-floating-toolbar"],
        });

        // Create the chat button
        const chatButtonEl = createEl("button", {
            cls: "cerebro-floating-button",
        });
        setIcon(chatButtonEl, ARROW_UP_ICON);

        toolbarEl.appendChild(chatButtonEl);
        this._connectToDOM(toolbarEl);

        // Add click handler to execute the chat command
        chatButtonEl.addEventListener("click", () => {
            const activeView = this._plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView) return;
            // @ts-ignore
            this._plugin.app.commands.executeCommandById(`cerebro:${CEREBRO_CHAT_ID}`);
        });

        return toolbarEl;


        // // Hide toolbar initially
        // this.floatingToolbar.style.display = "none";

        // // Initial toolbar visibility check
        // const activeLeaf = this.app.workspace.activeLeaf;
        // if (activeLeaf) {
        //     this.updateFloatingToolbarVisibility(activeLeaf);
        // }
    }

    handleClick(): any {
        throw new Error("Method not implemented.");
    }

    private _connectToDOM(toolbar: HTMLDivElement): void {
        // Find the view-content div in the current view
        const viewContent = this._chatInterface.view.containerEl.querySelector(".view-content");
        if (viewContent) {
            viewContent.appendChild(toolbar);
        } else {
            console.error("Could not find view-content div to attach toolbar");
        }
    }

    get active(): boolean {
        // TODO: Might not work. Define class.
        return this._containerEl.classList.contains("toolbar-active");
    }

    set active(value: boolean) {
        // TODO: Might not work. Define class.
        this._containerEl.classList.toggle("toolbar-active", value);
    }

    public show(): void {
        if (this.visible) return;
        // Workaround because we have no view.onClose event to deactivate buttons properly.
        this.active = this.visible;
        this.visible = true;
    }

    public hide(): void {
        if (!this.visible) return;
        this.visible = false;
    }

    public destroy(): void {
        this._containerEl.remove();
    }
}
