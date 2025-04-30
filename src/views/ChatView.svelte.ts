import Chat from "@/components/Chat.svelte";
import { CEREBRO_LUCIDE_ICON } from "@/constants";
import { modelToKey } from "@/helpers";
import { logger } from "@/logger";
import type Cerebro from "@/main";
import { type ConversationStore, createConversationStore } from "@/stores/convoParams.svelte";
import { createMessageStore, type MessageStore } from "@/stores/messages.svelte";
import type { ConversationParameters } from "@/types";
import { createNewChatFile } from "@/utils/chatCreation";
import {
    convertToMessageContent,
    parseConversationMarkdown,
    serializeMessagesToMarkdown,
} from "@/utils/markdownParser";
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
            this.loadFromFile(this.file);
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
        return CEREBRO_LUCIDE_ICON;
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
        if (this.messageStore.messages.length === 0) {
            return;
        }
        let file = this.file;
        if (!file) {
            const newFile = await createNewChatFile(this.plugin);
            if (!newFile) {
                return;
            }
            file = newFile;
        }

        // Save contents to file
        this.saveToFile(file);

        if (this.component) {
            unmount(this.component);
        }
        logger.debug("[Cerebro] Conversation saved successfully!");
    }

    public async loadFromFile(file: TFile): Promise<void> {
        // Load frontmatter data
        const frontmatter = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;

        if (frontmatter) {
            // Create params object from frontmatter
            const newParams: Partial<ConversationParameters> = {
                system: frontmatter.system,
                temperature: frontmatter.temperature,
                maxTokens: frontmatter.maxTokens,
                title: frontmatter.title || file.basename,
            };

            // Handle model - for now, use default model if model key is present
            if (frontmatter.model) {
                newParams.model = this.plugin.settings.defaults.model;
                // Log that we found a model but couldn't load it properly
                logger.debug(
                    `[Cerebro] Found model ${frontmatter.model} but using default model instead`,
                );
            }

            // Update all conversation parameters at once
            this.convoStore.updateAll(newParams);
        } else {
            // No frontmatter, just use the filename as title
            this.convoStore.updateTitle(file.basename);
        }

        // Load message content from file
        try {
            const fileContent = await this.plugin.app.vault.read(file);

            // Skip frontmatter if it exists
            let contentWithoutFrontmatter = fileContent;
            const frontmatterMatch = fileContent.match(/^---\n[\s\S]*?\n---\n/);
            if (frontmatterMatch) {
                contentWithoutFrontmatter = fileContent.slice(frontmatterMatch[0].length);
            }

            // Reset message store to ensure we're starting fresh
            this.messageStore.clearMessages();

            const parsedMessages = parseConversationMarkdown(contentWithoutFrontmatter);

            // Add messages to the store
            for (const message of parsedMessages) {
                const messageContent = convertToMessageContent(message.content);
                this.messageStore.addMessage(message.role, messageContent);
            }

            // Log the number of messages loaded
            logger.debug(
                `[Cerebro] Loaded ${this.messageStore.messages.length} messages from file`,
            );
        } catch (error) {
            logger.error(`[Cerebro] Error loading file: ${error}`);
        }
    }

    private async saveToFile(file: TFile): Promise<void> {
        await this.writeMessagesToFile(file);
        await this.saveFrontmatter(file);
    }

    private async writeMessagesToFile(file: TFile): Promise<void> {
        const messages = this.messageStore.messages;
        if (messages.length === 0) {
            return;
        }
        const content = serializeMessagesToMarkdown(messages);
        await this.plugin.app.vault.modify(file, content);
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
