import type { ConversationParameters, ModelConfig } from "@/types";

/**
 * Creates a conversation parameters store with reactive state
 * and methods for updating state with automatic persistence
 */
export const createConversationStore = (initialParams: ConversationParameters) => {
    // Core reactive state using Svelte 5 runes
    const params = $state({ ...initialParams });

    const updateModel = (model: ModelConfig): void => {
        params.model = model;
    };

    const updateSystem = (system: string[]): void => {
        params.system = system;
    };

    const updateTemperature = (temp: number): void => {
        params.temperature = temp;
    };

    const updateMaxTokens = (tokens: number): void => {
        params.maxTokens = tokens;
    };

    const updateTitle = (title: string): void => {
        params.title = title;
    };

    const updateAll = (newParams: Partial<ConversationParameters>): void => {
        // Update only the provided parameters
        if (newParams.model !== undefined) params.model = newParams.model;
        if (newParams.system !== undefined) params.system = newParams.system;
        if (newParams.temperature !== undefined) params.temperature = newParams.temperature;
        if (newParams.maxTokens !== undefined) params.maxTokens = newParams.maxTokens;
        if (newParams.title !== undefined) params.title = newParams.title;
    };

    return {
        // Read-only access to state
        get params(): ConversationParameters {
            return params;
        },

        // Methods for updating state
        updateModel,
        updateSystem,
        updateTemperature,
        updateMaxTokens,
        updateTitle,
        updateAll,
    };
};

// Export the type for use in components
export type ConversationStore = ReturnType<typeof createConversationStore>;
