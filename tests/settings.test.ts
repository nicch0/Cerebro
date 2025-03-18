import { CerebroSettings, DEFAULT_SETTINGS, getFrontmatter } from "lib/settings";
import { LLM } from "lib/types";

describe("Settings Module", () => {
    describe("DEFAULT_SETTINGS", () => {
        it("should have all required properties", () => {
            expect(DEFAULT_SETTINGS).toHaveProperty("defaultLLM");
            expect(DEFAULT_SETTINGS).toHaveProperty("llmSettings");
            expect(DEFAULT_SETTINGS).toHaveProperty("username");
            expect(DEFAULT_SETTINGS).toHaveProperty("assistantName");
            expect(DEFAULT_SETTINGS).toHaveProperty("stream");
            expect(DEFAULT_SETTINGS).toHaveProperty("chatTemplateFolder");
            expect(DEFAULT_SETTINGS).toHaveProperty("chatFolder");
            expect(DEFAULT_SETTINGS).toHaveProperty("autoInferTitle");
            expect(DEFAULT_SETTINGS).toHaveProperty("dateFormat");
            expect(DEFAULT_SETTINGS).toHaveProperty("headingLevel");
            expect(DEFAULT_SETTINGS).toHaveProperty("inferTitleLanguage");
        });

        it("should have settings for supported LLM providers", () => {
            expect(DEFAULT_SETTINGS.llmSettings).toHaveProperty("OpenAI");
            expect(DEFAULT_SETTINGS.llmSettings).toHaveProperty("Anthropic");
        });

        it("should have valid default values", () => {
            expect(DEFAULT_SETTINGS.username).toBe("User");
            expect(DEFAULT_SETTINGS.assistantName).toBe("Cerebro");
            expect(DEFAULT_SETTINGS.stream).toBe(true);
            expect(DEFAULT_SETTINGS.autoInferTitle).toBe(true);
            expect(DEFAULT_SETTINGS.headingLevel).toBe(3);
        });
    });

    describe("getFrontmatter", () => {
        it("should return the default frontmatter for the current LLM", () => {
            const settings: CerebroSettings = {
                ...DEFAULT_SETTINGS,
                defaultLLM: "OpenAI" as LLM,
            };

            const result = getFrontmatter(settings);

            expect(result).toBe(settings.llmSettings.OpenAI.defaultChatFrontmatter);
        });

        it("should return the correct frontmatter when changing LLM", () => {
            const settings: CerebroSettings = {
                ...DEFAULT_SETTINGS,
                defaultLLM: "Anthropic" as LLM,
            };

            const result = getFrontmatter(settings);

            expect(result).toBe(settings.llmSettings.Anthropic.defaultChatFrontmatter);
        });
    });
});
