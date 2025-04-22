import { MarkdownView } from "obsidian";
import ChatInterface from "./chatInterface";
import Cerebro from "./main";
import { fileIsChat } from "./helpers";

export default class ChatInterfaceManager {
    private _plugin: Cerebro;
    private static instance: ChatInterfaceManager;
    private _chats: Map<string, ChatInterface> = new Map();

    private constructor(plugin: Cerebro) {
        this._plugin = plugin;
        this.setupEventListeners();
    }

    public static initialize(plugin: Cerebro): ChatInterfaceManager {
        if (!ChatInterfaceManager.instance) {
            ChatInterfaceManager.instance = new ChatInterfaceManager(plugin);
        }
        return ChatInterfaceManager.instance;
    }

    public static getInstance(): ChatInterfaceManager {
        if (!ChatInterfaceManager.instance) {
            throw new Error("ChatInterfaceManager not initialized");
        }
        return ChatInterfaceManager.instance;
    }

    private getActiveMDView(): MarkdownView | null {
        const view: MarkdownView | null =
            this._plugin.app.workspace.getActiveViewOfType(MarkdownView);
        return view;
    }

    public getVisibleMDChatViews(): MarkdownView[] {
        const views: MarkdownView[] = this._plugin.app.workspace
            .getLeavesOfType("markdown")
            .map((leaf) => leaf.view as MarkdownView)
            .filter((view) => view.file && fileIsChat(this._plugin.app, view.file))
            .filter((view) => view.contentEl);
        return views;
    }

    private _getViewId(view: MarkdownView): string {
        // @ts-ignore:2239
        return view.leaf.id;
    }

    public getChatInView(view: MarkdownView): ChatInterface {
        const viewId: string = this._getViewId(view);
        if (!this._chats.has(viewId)) {
            this._chats.set(viewId, new ChatInterface(this._plugin, view));
        }

        return this._chats.get(viewId)!;
    }

    public updateViewForChat(view: MarkdownView): void {
        const chat: ChatInterface = this.getChatInView(view);
        chat.view = view;
    }

    public handleActiveLeafChange(view: MarkdownView): void {
        this.updateChatVisibility(view);
    }

    public handleMetadataChanged(): void {
        const view = this.getActiveMDView();
        if (!view) return;

        this.updateChatVisibility(view, true);
    }

    private setupEventListeners() {
        this._plugin.registerEvent(
            this._plugin.app.workspace.on("active-leaf-change", (leaf) => {
                if (!(leaf?.view instanceof MarkdownView)) return;
                const view: MarkdownView = leaf.view as MarkdownView;

                // Check if this is a chat file
                const isChat = view.file && fileIsChat(this._plugin.app, view?.file);

                // Get the view ID to track if we have a toolbar for this view
                const viewId = this._getViewId(view);

                if (isChat) {
                    // For chat files, get/create and update the chat interface
                    const chat = this.getChatInView(view);
                    chat.view = view;
                    if (!chat.isToolbarVisible) {
                        chat.showToolbar();
                    }
                } else if (this._chats.has(viewId)) {
                    // For non-chat files, hide toolbar if it exists for this view
                    const chat = this._chats.get(viewId)!;
                    if (chat.isToolbarVisible) {
                        chat.toolbar.hide();
                    }
                }
            }),
        );
    }

    private updateChatVisibility(view: MarkdownView, isMetadataChange = false): void {
        const chat: ChatInterface = this.getChatInView(view);

        // const hasHeadings: boolean =
        // 	chat.headings && chat.headings.length > 1;
        // const hasMinimumHeadings: boolean =
        // 	hasHeadings &&
        // 	chat.headings.length >=
        // 		this._plugin.settings.minimumHeadingsToRevealAutomatically;

        // // Update button visibility
        // chat.toggleButton(hasHeadings);

        // // Determine window visibility
        // const shouldHideWindow: boolean =
        // 	!hasHeadings ||
        // 	(!isMetadataChange &&
        // 		this._plugin.settings.revealAutomaticallyOnFileOpen &&
        // 		!hasMinimumHeadings);

        // const shouldShowWindow: boolean =
        // 	!isMetadataChange &&
        // 	!chat.toggledAutomaticallyOnce &&
        // 	this._plugin.settings.revealAutomaticallyOnFileOpen &&
        // 	hasMinimumHeadings &&
        // 	this._isEnoughWidthForAutomaticToggle(view);

        // // Update window state
        // if (shouldHideWindow) {
        // 	chat.hideWindow();
        // 	chat.windowPinned = false;
        // } else if (shouldShowWindow) {
        // 	chat.showWindow();
        // 	chat.windowPinned = true;
        // }

        // // Update window if visible
        // if (chat.windowVisible) {
        // 	chat.toggledAutomaticallyOnce
        // 	chat.updateWindow();
        // }
    }
    public createChatInOpenViews() {
        const views: MarkdownView[] = this.getVisibleMDChatViews();
        if (views.length === 0) return;

        views.map((view) => this.createChatInView(view));
    }

    private createChatInView(view: MarkdownView): any {
        const chat = this.getChatInView(view);
        if (!chat.isToolbarVisible) {
            chat.showToolbar();
        }
    }

    public removeAll() {
        this._chats.forEach((chat) => {
            chat.toolbar.destroy();
        });
        this._chats.clear();
    }
}
