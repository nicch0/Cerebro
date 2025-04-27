import { type IconName, ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import Chat from "@/components/Chat.svelte";
import { createMessageStore, type MessageStore } from "@/components/messages.svelte";
import type Cerebro from "@/main";
import type { ChatProperty } from "@/types";

export const CEREBRO_CHAT_VIEW = "cerebro-chat-view";

export class ChatView extends ItemView {
    public component: ReturnType<typeof Chat> | undefined;
    private plugin: Cerebro;
    private chatProperties: ChatProperty;
    private messageStore: MessageStore;
    private selectedText: string | undefined;

    constructor(leaf: WorkspaceLeaf, plugin: Cerebro, selectedText?: string) {
        super(leaf);
        this.plugin = plugin;
        const chatProperties = $state({
            title: "",
            model: this.plugin.settings.defaultModel,
            system: this.plugin.settings.defaultSystemPrompt,
            temperature: this.plugin.settings.defaultTemperature,
            maxTokens: this.plugin.settings.defaultMaxTokens,
        });
        this.chatProperties = chatProperties;
        const messageStore = createMessageStore();
        this.messageStore = messageStore;
        this.selectedText = selectedText;
    }

    public getViewType(): string {
        return CEREBRO_CHAT_VIEW;
    }

    public getDisplayText(): string {
        return this.chatProperties.title ? `Cerebro: ${this.chatProperties.title}` : "Cerebro";
    }

    public getIcon(): IconName {
        return "brain-circuit";
    }

    public async onOpen(): Promise<void> {
        this.component = mount(Chat, {
            target: this.contentEl,
            props: {
                ai: this.plugin.ai,
                // TODO: Abstract this to Svelte shared state so that its REACTIVE!
                settings: this.plugin.settings,
                chatProperties: this.chatProperties,
                messageStore: this.messageStore,
                selectedText: this.selectedText,
            },
        });
    }

    public async onClose(): Promise<void> {
        if (this.component) {
            unmount(this.component);
        }
    }
}
