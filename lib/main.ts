import * as anthropic from "@ai-sdk/anthropic";
import * as deepseek from "@ai-sdk/deepseek";
import * as google from "@ai-sdk/google";
import * as openai from "@ai-sdk/openai";
import * as xai from "@ai-sdk/xai";
import { experimental_createProviderRegistry as createProviderRegistry } from "ai";
import { isTitleTimestampFormat, writeInferredTitleToEditor } from "lib/helpers";
import { MarkdownView, Notice, Platform, Plugin, TFile } from "obsidian";
import ChatInterface from "./chatInterface";
import { getCommands } from "./commands";
import { CerebroMessages, ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "./constants";
import { logger } from "./logger";
import { AI } from "./ai";
import { CerebroSettings, DEFAULT_SETTINGS } from "./settings";
import { ChatFrontmatter, Message } from "./types";
import { SettingsTab } from "./views/settingsTab";

export default class Cerebro extends Plugin {
    public chatInterfaces: Map<TFile, ChatInterface> = new Map();
    public settings: CerebroSettings;
    public statusBar: HTMLElement;
    public ai: AI;

    public async onload(): Promise<void> {
        logger.debug("[Cerebro] Adding status bar");
        this.statusBar = this.addStatusBarItem();

        logger.debug("[Cerebro] Loading settings");
        await this.loadSettings();

        this.initializeAI();
        this.addSettingTab(new SettingsTab(this.app, this));

        // Register all commands
        const commands = getCommands(this);
        commands.forEach((command) => this.addCommand(command));
    }

    private initializeAI(): void {
        type ProviderConfigs = Parameters<typeof createProviderRegistry>[0];

        const providerConfig: ProviderConfigs = {};

        if (this.settings.providerSettings.OpenAI.apiKey) {
            providerConfig.openai = openai.createOpenAI({
                apiKey: this.settings.providerSettings.OpenAI.apiKey,
            });
        }

        if (this.settings.providerSettings.Anthropic.apiKey) {
            providerConfig.anthropic = anthropic.createAnthropic({
                apiKey: this.settings.providerSettings?.Anthropic?.apiKey,
                headers: { 'anthropic-dangerous-direct-browser-access': 'true' }
            });
        }

        if (this.settings.providerSettings.Google.apiKey) {
            providerConfig.google = google.createGoogleGenerativeAI({
                apiKey: this.settings.providerSettings?.Google?.apiKey,
            });
        }

        if (this.settings.providerSettings.DeepSeek.apiKey) {
            providerConfig.deepseek = deepseek.createDeepSeek({
                apiKey: this.settings.providerSettings.DeepSeek.apiKey,
            });
        }

        if (this.settings.providerSettings.XAI.apiKey) {
            providerConfig.xai = xai.createXai({
                apiKey: this.settings.providerSettings.XAI.apiKey,
            });
        }

        const llmProvider = createProviderRegistry(providerConfig);
        this.ai = new AI(llmProvider);
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
        logger.debug("Loaded settings", this.settings);
    }

    public async saveSettings(): Promise<void> {
        logger.info("[Cerebro] Saving settings");
        await this.saveData(this.settings);
        this.initializeAI();
    }

    public async onunload(): Promise<void> {
        this.chatInterfaces.clear();
    }
}
