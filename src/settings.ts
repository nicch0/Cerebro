import { modelToKey } from "./helpers";
import type { ModelConfig, Provider } from "./types";

export interface ProviderSettings {
    apiKey: string;
}

export interface CerebroSettings {
    providerSettings: Record<Provider, ProviderSettings>;
    userName: string;
    assistantName: string;
    chatTemplateFolder: string;
    chatFolder: string;
    autoInferTitle: boolean;
    dateFormat: string;
    inferTitleLanguage: string;
    defaults: {
        model: ModelConfig;
        temperature: number;
        maxTokens: number;
        system: string[];
    };
    defaultModel: ModelConfig;
    defaultStream: boolean;
    defaultTemperature: number;
    defaultMaxTokens: number;
    defaultSystemPrompt: string[];
}

export const DEFAULT_SETTINGS: CerebroSettings = {
    providerSettings: {
        OpenAI: {
            apiKey: "default",
        },
        Anthropic: {
            apiKey: "default",
        },
        Google: {
            apiKey: "default",
        },
        DeepSeek: {
            apiKey: "default",
        },
        XAI: {
            apiKey: "default",
        },
    },
    userName: "User",
    assistantName: "Cerebro",
    chatTemplateFolder: "Cerebro/Templates",
    chatFolder: "Cerebro/Chats",
    autoInferTitle: true,
    dateFormat: "YYYY-MM-DD-hhmmss",
    inferTitleLanguage: "English",

    defaultModel: {
        alias: "claude-3-5-sonnet",
        name: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
    } satisfies ModelConfig,
    defaultStream: true,
    defaultTemperature: 0.7,
    defaultMaxTokens: 1024,
    defaultSystemPrompt: ["I am a helpful assistant."],

    defaults: {
        model: {
            alias: "claude-3-5-sonnet",
            name: "claude-3-5-sonnet-20241022",
            provider: "anthropic",
        },
        temperature: 0.7,
        maxTokens: 1024,
        system: ["I am a helpful assistant."],
    },
};

export const generateChatFrontmatter = (settings: CerebroSettings): string => {
    const yamlLines = [];
    yamlLines.push(`temperature: ${settings.defaults.temperature}`);
    yamlLines.push(`maxTokens: ${settings.defaults.maxTokens}`);
    yamlLines.push(`system: ${settings.defaults.system}`);
    yamlLines.push(`model: ${modelToKey(settings.defaults.model)}`);
    return `---\n${yamlLines.join("\n")}\n---\n`;
};
