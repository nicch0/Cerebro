import { Command, Editor, MarkdownView, Notice, Platform } from "obsidian";
import ChatInterface from "../chatInterface";
import { CerebroMessages, ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "../constants";
import { logger } from "../logger";
import Cerebro from "../main";

export const chatCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-chat",
    name: "Chat",
    icon: "message-circle",
    editorCallback: async (editor: Editor, view: MarkdownView) => {
        if (Platform.isMobile) {
            new Notice(CerebroMessages.CALLING_API);
        }

        if (!view.file) {
            throw new Error("No active file");
        }

        // Get or create ChatInterface for this file
        let chatInterface = plugin.chatInterfaces.get(view.file);
        if (!chatInterface) {
            chatInterface = new ChatInterface(plugin.settings, view);
            plugin.chatInterfaces.set(view.file, chatInterface);
        }

        const frontmatter = chatInterface.getFrontmatter(plugin.app);
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
