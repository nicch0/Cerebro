import ModelManager from "./modelManager";
import type { ModelConfig, Provider } from "./types";

export interface ProviderSettings {
    apiKey: string;
}

export interface CerebroSettings {
    providers: Record<Provider, ProviderSettings>;
    userName: string;
    assistantName: string;
    chatTemplateFolder: string;
    chatFolder: string;
    autoInferTitle: boolean;
    dateFormat: string;
    inferTitleLanguage: string;
    modelDefaults: {
        model: ModelConfig;
        temperature: number;
        maxTokens: number;
        system: string[];
    };
}

export const getDefaultSettings = (modelManager: ModelManager): CerebroSettings => {
    return {
        providers: {
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
        modelDefaults: {
            model: modelManager.defaultModel,
            temperature: 0.7,
            maxTokens: 1024,
            system: ["I am a helpful assistant."],
        },
    };
};

export const generateChatFrontmatter = (settings: CerebroSettings): string => {
    const yamlLines = [];
    yamlLines.push(`temperature: ${settings.modelDefaults.temperature}`);
    yamlLines.push(`maxTokens: ${settings.modelDefaults.maxTokens}`);
    yamlLines.push(`system: ${settings.modelDefaults.system}`);
    yamlLines.push(`model: ${settings.modelDefaults.model.key}`);
    return `---\n${yamlLines.join("\n")}\n---\n`;
};
