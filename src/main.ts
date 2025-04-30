import { MarkdownView, Notice, Platform, Plugin, WorkspaceLeaf } from "obsidian";
import { AI } from "./ai";
import { openChat } from "./chat";
import { getCommands } from "./commands";
import {
    CEREBRO_LUCIDE_ICON,
    CerebroMessages,
    ERROR_NOTICE_TIMEOUT_MILLISECONDS,
} from "./constants";
import { isTitleTimestampFormat, writeInferredTitleToEditor } from "./helpers";
import { logger } from "./logger";
import ModelManager from "./modelManager";
import { OverlayManager } from "./overlayManager";
import { type CerebroSettings, getDefaultSettings } from "./settings";
import type { ChatFrontmatter, Message } from "./types";
import { CEREBRO_CHAT_VIEW, ChatView } from "./views/ChatView.svelte";
import { SettingsTab } from "./views/settingsTab";

export default class Cerebro extends Plugin {
    public settings!: CerebroSettings;
    public statusBar!: HTMLElement;
    public ai!: AI;
    private overlayManager!: OverlayManager;

    public async onload(): Promise<void> {
        logger.debug("[Cerebro] Adding status bar");
        this.statusBar = this.addStatusBarItem();

        logger.debug("[Cerebro] Loading settings");
        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this));

        ModelManager.initialize();
        this.ai = new AI(this.settings);

        // Register all commands
        const commands = getCommands(this);
        commands.forEach((command) => this.addCommand(command));

        this.registerView(CEREBRO_CHAT_VIEW, (leaf) => new ChatView(leaf, this));
        this.addRibbonIcon(CEREBRO_LUCIDE_ICON, "Open Cerebro", () => {
            openChat(this, true);
        });

        // Set up Cerebro overlay
        this.overlayManager = new OverlayManager(this);

        this.app.workspace.onLayoutReady(() => {
            this.overlayManager.createButtonsInOpenViews();
        });

        this.registerEvent(
            this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
                if (!(leaf?.view instanceof MarkdownView)) {
                    return;
                }
                const view: MarkdownView = leaf.view as MarkdownView;
                this.overlayManager.updateViewForOverlay(view);
                this.overlayManager.handleActiveLeafChange(view);
            }),
        );
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
        const modelManager = ModelManager.initialize();
        this.settings = Object.assign({}, getDefaultSettings(modelManager), await this.loadData());
        logger.debug("[Cerebro] Loaded settings", this.settings);
    }

    public async saveSettings(): Promise<void> {
        logger.debug("[Cerebro] Saving settings");
        await this.saveData(this.settings);
        this.ai = new AI(this.settings);
    }

    public async onunload(): Promise<void> {
        // TODO: Ensure all HTML elements are removed from the DOM
        this.app.workspace.detachLeavesOfType(CEREBRO_CHAT_VIEW);
        this.overlayManager.removeAll();
    }
}
