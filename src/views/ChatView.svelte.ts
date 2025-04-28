import { type IconName,ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import Chat from "@/components/Chat.svelte";
import { getDate, modelToKey } from "@/helpers";
import type Cerebro from "@/main";
import { type ConversationStore,createConversationStore } from "@/stores/convoParams.svelte";
import { createMessageStore, type MessageStore } from "@/stores/messages.svelte";
import { validateAndCreateChatFolder } from "@/utils/chatCreation";

export const CEREBRO_CHAT_VIEW = "cerebro-chat-view";

export class ChatView extends ItemView {
    public component: ReturnType<typeof Chat> | undefined;
    private plugin: Cerebro;
    private convoStore: ConversationStore;
    private messageStore: MessageStore;
    private selectedText: string | undefined;
    private file!: TFile;

    /**
     * Factory method to create a ChatView instance asynchronously
     * @param leaf The workspace leaf to attach to
     * @param plugin The Cerebro plugin instance
     * @param selectedText Optional selected text to include in the chat
     * @param file Optional existing file to use instead of creating a new one
     * @returns A Promise that resolves to a new ChatView instance
     */
    public static async create(
        leaf: WorkspaceLeaf,
        plugin: Cerebro,
        selectedText?: string,
        file?: TFile,
    ): Promise<ChatView> {
        // Create a new instance with private constructor
        const view = new ChatView(leaf, plugin, selectedText);

        // Initialize the file - either use provided file or create a new one
        if (file) {
            view.file = file;
        } else {
            view.file = await view.createNewChatFile();
            view.saveFrontmatter();
        }

        return view;
    }

    /**
     * Private constructor to prevent direct instantiation
     * Only the factory method should create instances
     */
    private constructor(leaf: WorkspaceLeaf, plugin: Cerebro, selectedText?: string) {
        super(leaf);
        this.plugin = plugin;

        // Create conversation store with initial values and save callback
        this.convoStore = createConversationStore({
            title: "",
            model: this.plugin.settings.defaults.model,
            system: this.plugin.settings.defaults.system,
            temperature: this.plugin.settings.defaults.temperature,
            maxTokens: this.plugin.settings.defaults.maxTokens,
        });

        this.messageStore = createMessageStore();
        this.selectedText = selectedText;
    }

    /**
     * Create a new chat file with frontmatter
     * @returns
     */
    private async createNewChatFile(): Promise<TFile> {
        const folderValid = await validateAndCreateChatFolder(this.plugin);
        if (!folderValid) {
            throw new Error("Failed to create chat folder");
        }

        const filePath = `${this.plugin.settings.chatFolder}/${getDate(
            new Date(),
            this.plugin.settings.dateFormat,
        )}.md`;

        const file = await this.plugin.app.vault.create(filePath, "");

        if (!file) {
            throw new Error("Failed to create chat file");
        }

        return file;
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
        // Save frontmatter before closing
        await this.saveFrontmatter();
        if (this.component) {
            unmount(this.component);
        }
    }

    private async saveFrontmatter(): Promise<void> {
        const params = this.convoStore.params;
        await this.plugin.app.fileManager.processFrontMatter(this.file, (frontmatter) => {
            frontmatter.system = params.system;
            frontmatter.temperature = params.temperature;
            frontmatter.maxTokens = params.maxTokens;
            frontmatter.model = modelToKey(params.model);
        });
    }
}
