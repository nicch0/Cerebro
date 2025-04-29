import Chat from "@/components/Chat.svelte";
import { modelToKey } from "@/helpers";
import { logger } from "@/logger";
import type Cerebro from "@/main";
import { type ConversationStore, createConversationStore } from "@/stores/convoParams.svelte";
import { createMessageStore, type MessageStore } from "@/stores/messages.svelte";
import { type IconName, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";

export const CEREBRO_CHAT_VIEW = "cerebro-chat-view";

export class ChatView extends ItemView {
    public component: ReturnType<typeof Chat> | undefined;
    private plugin: Cerebro;
    private convoStore: ConversationStore;
    private messageStore: MessageStore;
    private selectedText?: string;
    private file?: TFile;

    constructor(leaf: WorkspaceLeaf, plugin: Cerebro, selectedText?: string, file?: TFile) {
        super(leaf);
        this.plugin = plugin;

        this.convoStore = createConversationStore({
            title: "",
            model: this.plugin.settings.defaults.model,
            system: this.plugin.settings.defaults.system,
            temperature: this.plugin.settings.defaults.temperature,
            maxTokens: this.plugin.settings.defaults.maxTokens,
        });
        this.messageStore = createMessageStore();

        if (selectedText) {
            this.selectedText = selectedText;
        }

        if (file) {
            this.file = file;
        }
    }

    public getViewType(): string {
        return CEREBRO_CHAT_VIEW;
    }

    public getDisplayText(): string {
        return this.convoStore.params.title
            ? `Cerebro: ${this.convoStore.params.title}`
            : "Cerebro";
    }

    public getIcon(): IconName {
        return "brain-circuit";
    }

    public async onOpen(): Promise<void> {
        const { ai, settings } = this.plugin;
        const { convoStore, messageStore, selectedText } = this;

        this.component = mount(Chat, {
            target: this.contentEl,
            props: {
                ai,
                settings,
                convoStore,
                messageStore,
                selectedText,
            },
        });
    }

    public async onClose(): Promise<void> {
        if (this.file) {
            // Save frontmatter before closing
            await this.saveFrontmatter(this.file);
        }
        if (this.component) {
            unmount(this.component);
        }
        logger.debug("[Cerebro] Conversation saved successfully!");
    }

    private async saveFrontmatter(file: TFile): Promise<void> {
        const params = this.convoStore.params;
        await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
            frontmatter.system = params.system;
            frontmatter.temperature = params.temperature;
            frontmatter.maxTokens = params.maxTokens;
            frontmatter.model = modelToKey(params.model);
        });
    }
}
