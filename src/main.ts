import { MarkdownView, Notice, Platform, Plugin, WorkspaceLeaf } from "obsidian";
import { AI } from "./ai";
import { getCommands } from "./commands";
import { CerebroMessages, ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "./constants";
import { isTitleTimestampFormat, writeInferredTitleToEditor } from "./helpers";
import { logger } from "./logger";
import { type CerebroSettings, DEFAULT_SETTINGS } from "./settings";
import type { ChatFrontmatter, Message } from "./types";
import { CEREBRO_CHAT_VIEW, ChatView } from "./views/ChatView.svelte";
import { SettingsTab } from "./views/settingsTab";

export default class Cerebro extends Plugin {
    public settings!: CerebroSettings;
    public statusBar!: HTMLElement;
    public ai!: AI;

    public async onload(): Promise<void> {
        logger.debug("[Cerebro] Adding status bar");
        this.statusBar = this.addStatusBarItem();

        logger.debug("[Cerebro] Loading settings");
        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this));

        this.ai = new AI(this.settings);

        // Register all commands
        const commands = getCommands(this);
        commands.forEach((command) => this.addCommand(command));
        this.registerView(CEREBRO_CHAT_VIEW, (leaf) => new ChatView(leaf, this));
        this.addRibbonIcon("brain-circuit", "Open Cerebro", () => {
            this.activateView();
        });
    }

    public async activateView(): Promise<void> {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(CEREBRO_CHAT_VIEW);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            leaf = workspace.getRightLeaf(false);
            if (!leaf) {
                return;
            }
            await leaf.setViewState({ type: CEREBRO_CHAT_VIEW, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf);
    }

    public async handleTitleInference(
        messages: Message[],
        view: MarkdownView,
        frontmatter: ChatFrontmatter,
    ): Promise<void> {
        const title = view?.file?.basename;

        if (
            title &&
            isTitleTimestampFormat(title, this.settings.dateFormat) &&
            messages.length >= 4
        ) {
            try {
                const newTitle = await this.ai.inferTitle(
                    messages,
                    this.settings.inferTitleLanguage,
                    frontmatter,
                    this.settings,
                );
                if (newTitle) {
                    await writeInferredTitleToEditor(
                        this.app.vault,
                        view,
                        this.app.fileManager,
                        this.settings.chatFolder,
                        newTitle,
                    );
                } else {
                    new Notice("[Cerebro] Could not infer title", 5000);
                }
            } catch (e) {
                logger.error(e);
                this.statusBar.setText(CerebroMessages.EMPTY);
                if (Platform.isMobile) {
                    new Notice(
                        `[Cerebro] Error inferring title: ${e.message}`,
                        ERROR_NOTICE_TIMEOUT_MILLISECONDS,
                    );
                }
            }
        }
    }

    private async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        logger.debug("[Cerebro] Loaded settings", this.settings);
    }

    public async saveSettings(): Promise<void> {
        logger.info("[Cerebro] Saving settings");
        await this.saveData(this.settings);
        this.ai = new AI(this.settings);
    }

    public async onunload(): Promise<void> {
        // TODO: Ensure all HTML elements are removed from the DOM
    }
}
