import { Command, Editor, MarkdownView, Notice } from "obsidian";
import ChatInterface from "../chatInterface";
import { writeInferredTitleToEditor } from "../helpers";
import Cerebro from "../main";
import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "lib/constants";

export const inferTitleCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-infer-title",
    name: "Infer title",
    icon: "subtitles",
    editorCallback: async (_: Editor, view: MarkdownView) => {
        if (!view.file) {
            throw new Error("No active file");
        }

        const chatInterface = plugin.chatInterfaceManager.getChatInView(view);
        const frontmatter = chatInterface.getChatFrontmatter(plugin.app);
        const { messages } = await chatInterface.getMessages(plugin.app);

        try {
            new Notice("[Cerebro] Inferring title from messages...");

            // TODO: Doesn't work when the user hasn't provided a message yet
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
