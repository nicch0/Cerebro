import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import CerebroChat from "@/components/CerebroChat.svelte";
import type Cerebro from "@/main";

export const CEREBRO_CHAT_VIEW = "cerebro-chat-view";

export class ChatView extends ItemView {
    component: ReturnType<typeof CerebroChat> | undefined;
    private _plugin: Cerebro;

    constructor(leaf: WorkspaceLeaf, plugin: Cerebro) {
        super(leaf);
        this._plugin = plugin;
    }

    getViewType() {
        return CEREBRO_CHAT_VIEW;
    }

    getDisplayText() {
        return "Cerebro: New Chat";
    }

    async onOpen() {
        this.component = mount(CerebroChat, {
            target: this.contentEl,
            props: {},
        });
    }

    async onClose() {
        if (this.component) {
            unmount(this.component);
        }
    }
}
