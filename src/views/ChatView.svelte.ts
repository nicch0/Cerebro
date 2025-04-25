import Chat from "@/components/Chat.svelte";
import { createMessageStore, type MessageStore } from "@/components/messages.svelte";
import type Cerebro from "@/main";
import type { ChatProperty } from "@/types";
import { ItemView, WorkspaceLeaf, type IconName } from "obsidian";
import { mount, unmount } from "svelte";

export const CEREBRO_CHAT_VIEW = "cerebro-chat-view";

export class ChatView extends ItemView {
    public component: ReturnType<typeof Chat> | undefined;
    private plugin: Cerebro;
    private chatProperties: ChatProperty;
    private messageStore: MessageStore;

    constructor(leaf: WorkspaceLeaf, plugin: Cerebro) {
        super(leaf);
        this.plugin = plugin;
        const chatProperties = $state({
            title: "Test title",
            model: "openai:gpt-4",
            stream: true,
            system: ["You are a helpful assistant"],
        });
        this.chatProperties = chatProperties;
        const messageStore = createMessageStore();
        this.messageStore = messageStore;
    }

    getViewType() {
        return CEREBRO_CHAT_VIEW;
    }

    getDisplayText() {
        return `Cerebro: ${this.chatProperties.title}`;
    }

    getIcon(): IconName {
        return "brain-circuit";
    }

    async onOpen() {
        this.component = mount(Chat, {
            target: this.contentEl,
            props: {
                ai: this.plugin.ai,
                // TODO: Abstract this to Svelte shared state so that its REACTIVE!
                settings: this.plugin.settings,
                chatProperties: this.chatProperties,
                messageStore: this.messageStore,
            },
        });
    }

    async onClose() {
        if (this.component) {
            unmount(this.component);
        }
    }
}
