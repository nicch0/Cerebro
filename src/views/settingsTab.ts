import { App, PluginSettingTab, Setting } from "obsidian";
import type { ModelConfig } from "@/types";
import { findModelByKey, getModelOptions } from "../helpers";
import Cerebro from "../main";

export class SettingsTab extends PluginSettingTab {
    private plugin: Cerebro;

    constructor(app: App, plugin: Cerebro) {
        super(app, plugin);
        this.plugin = plugin;
    }

    public display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("User's name")
            .setDesc("Your name in the conversation")
            .addText((text) =>
                text.setValue(this.plugin.settings.userName).onChange(async (value) => {
                    this.plugin.settings.userName = value;
                    await this.plugin.saveSettings();
                }),
            );

        new Setting(containerEl)
            .setName("Assistant's name")
            .setDesc("The assistant's name in the conversation")
            .addText((text) =>
                text.setValue(this.plugin.settings.assistantName).onChange(async (value) => {
                    this.plugin.settings.assistantName = value;
                    await this.plugin.saveSettings();
                }),
            );

        // folder for chat files
        new Setting(containerEl)
            .setName("Chat Folder")
            .setDesc("Path to folder for chat files")
            .addText((text) =>
                text.setValue(this.plugin.settings.chatFolder).onChange(async (value) => {
                    this.plugin.settings.chatFolder = value;
                    await this.plugin.saveSettings();
                }),
            );

        // folder for chat file templates
        new Setting(containerEl)
            .setName("Chat Template Folder")
            .setDesc("Path to folder for chat file templates")
            .addText((text) =>
                text
                    .setPlaceholder("chat-templates")
                    .setValue(this.plugin.settings.chatTemplateFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.chatTemplateFolder = value;
                        await this.plugin.saveSettings();
                    }),
            );

        // automatically infer title
        new Setting(containerEl)
            .setName("Automatically Infer Title")
            .setDesc("Automatically infer title after a few messages have been exchanged.")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.autoInferTitle).onChange(async (value) => {
                    this.plugin.settings.autoInferTitle = value;
                    await this.plugin.saveSettings();
                }),
            );

        new Setting(containerEl)
            .setName("Title Language")
            .setDesc("Language to use when Cerebro creates title")
            .addDropdown((dropdown) => {
                dropdown.addOptions({
                    English: "English",
                    Japanese: "Japanese",
                    Spanish: "Spanish",
                    French: "French",
                    German: "German",
                    Chinese: "Chinese",
                    Korean: "Korean",
                    Italian: "Italian",
                    Russian: "Russian",
                });
                dropdown.setValue(this.plugin.settings.inferTitleLanguage);
                dropdown.onChange(async (value) => {
                    this.plugin.settings.inferTitleLanguage = value;
                    await this.plugin.saveSettings();
                });
            });

        // date format for chat files
        new Setting(containerEl)
            .setName("Date Format")
            .setDesc("Date format for chat files. Valid date blocks are: YYYY, MM, DD, hh, mm, ss")
            .addText((text) =>
                text
                    .setPlaceholder("YYYYMMDDhhmmss")
                    .setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dateFormat = value;
                        await this.plugin.saveSettings();
                    }),
            );

        containerEl.createEl("h2", {
            text: "Model Settings",
        });

        const { provider: defaultProvider, name: defaultModelName } =
            this.plugin.settings.defaultModel;
        new Setting(containerEl)
            .setName("Default model")
            .setDesc("Default model to use for new chats")
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions(getModelOptions())
                    .setValue(`${defaultProvider}:${defaultModelName}`)
                    .onChange(async (key: string) => {
                        const model = findModelByKey(key) as ModelConfig;
                        this.plugin.settings.defaultModel = model;
                        await this.plugin.saveSettings();
                    });
            });

        // Temperature slider
        new Setting(containerEl)
            .setName("Temperature")
            .setDesc(
                "Controls the randomness of the model's responses. Lower values make responses more deterministic, higher values more creative.",
            )
            .addSlider((slider) =>
                slider
                    .setLimits(0, 1.0, 0.1)
                    .setValue(this.plugin.settings.defaultTemperature)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.defaultTemperature = value;
                        await this.plugin.saveSettings();
                    }),
            );

        // Max tokens
        new Setting(containerEl)
            .setName("Max Tokens")
            .setDesc("The maximum number of tokens to generate in the response.")
            .addText((text) =>
                text
                    .setValue((this.plugin.settings.defaultMaxTokens || 1024).toString())
                    .onChange(async (value) => {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 0) {
                            this.plugin.settings.defaultMaxTokens = numValue;
                            await this.plugin.saveSettings();
                        }
                    }),
            );

        // Default system prompt
        new Setting(containerEl)
            .setName("System Prompt")
            .setDesc("Default instructions given to the model for all new chats.")
            .addTextArea((textArea) =>
                textArea
                    .setValue(this.plugin.settings.defaultSystemPrompt.join("\n") || "")
                    .onChange(async (value) => {
                        this.plugin.settings.defaultSystemPrompt = value.split("\n");
                        await this.plugin.saveSettings();
                    }),
            );

        // // Advanced mode toggle
        // new Setting(containerEl)
        //     .setName("Advanced Mode")
        //     .setDesc(
        //         "When enabled, all model parameters will be exposed in the properties of new notes",
        //     )
        //     .addToggle((toggle) =>
        //         toggle
        //             .setValue(this.plugin.settings.advancedMode || false)
        //             .onChange(async (value) => {
        //                 this.plugin.settings.advancedMode = value;
        //                 await this.plugin.saveSettings();
        //             }),
        //     );

        containerEl.createEl("h2", {
            text: "API Keys",
        });

        new Setting(containerEl)
            .setName("OpenAI")
            .setDesc("API Key for OpenAI")
            .addText((text) =>
                text
                    .setPlaceholder("some-api-key")
                    .setValue(this.plugin.settings.providerSettings.OpenAI.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.providerSettings.OpenAI.apiKey = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Anthropic")
            .setDesc("API Key for Anthropic")
            .addText((text) =>
                text
                    .setPlaceholder("some-api-key")
                    .setValue(this.plugin.settings.providerSettings.Anthropic.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.providerSettings.Anthropic.apiKey = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Google")
            .setDesc("API Key for Google Gemini")
            .addText((text) =>
                text
                    .setPlaceholder("some-api-key")
                    .setValue(this.plugin.settings.providerSettings.Google?.apiKey || "")
                    .onChange(async (value) => {
                        this.plugin.settings.providerSettings.Google.apiKey = value;
                        await this.plugin.saveSettings();
                    }),
            );
        new Setting(containerEl)
            .setName("DeepSeek")
            .setDesc("API Key for DeepSeek")
            .addText((text) =>
                text
                    .setPlaceholder("some-api-key")
                    .setValue(this.plugin.settings.providerSettings.DeepSeek?.apiKey || "")
                    .onChange(async (value) => {
                        this.plugin.settings.providerSettings.DeepSeek.apiKey = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("XAI")
            .setDesc("API Key for XAI/Grok")
            .addText((text) =>
                text
                    .setPlaceholder("some-api-key")
                    .setValue(this.plugin.settings.providerSettings.XAI?.apiKey || "")
                    .onChange(async (value) => {
                        this.plugin.settings.providerSettings.XAI.apiKey = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
