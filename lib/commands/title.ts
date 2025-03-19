import { Command, Editor, MarkdownView, Notice } from "obsidian";
import ChatInterface from "../chatInterface";
import { writeInferredTitleToEditor } from "../helpers";
import Cerebro from "../main";
import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "lib/constants";

export const inferTitleCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-infer-title",
    name: "Infer title",
    icon: "subtitles",
    editorCallback: async (editor: Editor, view: MarkdownView) => {
        const chatInterface = new ChatInterface(plugin.settings, editor, view);
        const frontmatter = chatInterface.getFrontmatter(plugin.app);
        const { messages } = await chatInterface.getMessages(plugin.app);
        new Notice("[Cerebro] Inferring title from messages...");
        try {
            const title = await plugin.ai.inferTitle(
                messages,
                plugin.settings.inferTitleLanguage,
                frontmatter,
                plugin.settings,
            );
            if (title) {
                await writeInferredTitleToEditor(
                    plugin.app.vault,
                    view,
                    plugin.app.fileManager,
                    plugin.settings.chatFolder,
                    title,
                );
            }
        } catch (e) {
            new Notice(
                "[Cerebro] Error inferring title from messages",
                ERROR_NOTICE_TIMEOUT_MILLISECONDS,
            );
            throw new Error("[Cerebro] Error inferring title from messages" + e);
        }
    },
});
