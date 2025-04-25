import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import Chat from "@/components/Chat.svelte";
import type Cerebro from "@/main";

export const CEREBRO_CHAT_VIEW = "cerebro-chat-view";

export class ChatView extends ItemView {
    component: ReturnType<typeof Chat> | undefined;
    private _plugin: Cerebro;

    constructor(leaf: WorkspaceLeaf, plugin: Cerebro) {
        super(leaf);
        this._plugin = plugin;
    }

    getViewType() {
        return CEREBRO_CHAT_VIEW;
    }

    getDisplayText() {
        return "Cerebro";
    }

    async onOpen() {
        this.component = mount(Chat, {
            target: this.contentEl,
            props: {
                ai: this._plugin.ai,
                // TODO: Abstract this to Svelte shared state so that its REACTIVE!
                settings: this._plugin.settings,
            },
        });
    }

    async onClose() {
        if (this.component) {
            unmount(this.component);
        }
    }
}
