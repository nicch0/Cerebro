import { MODEL_PROPERTY_NAME, PROPERTY_MAPPINGS } from "./ai";
import type { Provider } from "./types";

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
    headingLevel: number;
    inferTitleLanguage: string;

    defaultModel: string;
    defaultStream: boolean;
    defaultTemperature: number;
    defaultMaxTokens: number;
    defaultSystemPrompt: string;
    advancedMode: boolean;
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
    headingLevel: 3,
    inferTitleLanguage: "English",

    defaultModel: "openai:gpt-4o-mini",
    defaultStream: true,
    defaultTemperature: 0.7,
    defaultMaxTokens: 1024,
    defaultSystemPrompt: "I am a helpful assistant.",
    advancedMode: false,
};

export const generateChatFrontmatter = (settings: CerebroSettings): string => {
    if (!settings.advancedMode) {
        // Original simple behavior
        return `---${MODEL_PROPERTY_NAME}: ${settings.defaultModel}\n---\n`;
    }

    // Advanced mode: include all parameters from property mappings
    const yamlLines = PROPERTY_MAPPINGS.map((mapping) => {
        const value = settings[mapping.settingsKey];

        // Handle different types of values
        const formattedValue = typeof value === "string" ? `"${value}"` : value;
        return `${mapping.frontmatterKey}: ${formattedValue}`;
    });

    // Add other settings not part of the regular mappings
    yamlLines.push(`system_prompt: "${settings.defaultSystemPrompt}"`);

    return `---\n${yamlLines.join("\n")}\n---\n`;
};
