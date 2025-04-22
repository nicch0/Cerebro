import { type Command, Editor, MarkdownView, Notice, Platform } from "obsidian";
import { CerebroMessages, ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "../constants";
import { logger } from "../logger";
import Cerebro from "../main";

export const CEREBRO_CHAT_ID = "cerebro-chat";
export const chatCommand = (plugin: Cerebro): Command => ({
    id: CEREBRO_CHAT_ID,
    name: "Chat",
    icon: "message-circle",
    editorCallback: async (_: Editor, view: MarkdownView) => {
        if (Platform.isMobile) {
            new Notice(CerebroMessages.CALLING_API);
        }

        if (!view.file) {
            throw new Error("No active file");
        }

        const chatInterface = plugin.chatInterfaceManager.getChatInView(view);
        const frontmatter = chatInterface.getChatFrontmatter(plugin.app);
        const { messages, files } = await chatInterface.getMessages(plugin.app);
        logger.debug(`[Cerebro] Retrieved messages`, messages);
        chatInterface.completeUserResponse();

        try {
            plugin.statusBar.setText(CerebroMessages.CALLING_API);
            const response = await plugin.ai.chat(
                messages,
                frontmatter,
                plugin.settings,
                chatInterface,
            );
            chatInterface.completeAssistantResponse();

            if (response && plugin.settings.autoInferTitle) {
                await plugin.handleTitleInference(messages.concat(response), view, frontmatter);
            }
        } catch (e) {
            new Notice("[Cerebro] Chat failed: " + e.message, ERROR_NOTICE_TIMEOUT_MILLISECONDS);
        }

        plugin.statusBar.setText(CerebroMessages.EMPTY);

        if (files.size > 0) {
            new Notice(CerebroMessages.UPDATING_PROPERTIES);
            chatInterface.updateFrontmatterWithFiles(plugin.app, files);
            plugin.statusBar.setText(CerebroMessages.EMPTY);
        }
    },
});
