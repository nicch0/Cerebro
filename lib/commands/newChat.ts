import { Command, MarkdownView, Notice } from "obsidian";
import ChatInterface from "../chatInterface";
import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "../constants";
import { logger } from "../logger";
import Cerebro from "../main";
import { createNewChatFile, openInMainEditor } from "./chatCreation";

export const createNewChatCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-create-new-chat",
    name: "Create new chat",
    icon: "message-square-plus",
    callback: async () => {
        try {
            const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
            const selectedText = activeView?.editor?.getSelection() || "";

            const newFile = await createNewChatFile(plugin, selectedText);
            if (!newFile) {
                return;
            }

            const leaf = plugin.app.workspace.getLeaf();
            await leaf.openFile(newFile);

            if (!(leaf.view instanceof MarkdownView)) {
                return;
            }
            const view = leaf.view as MarkdownView;

            const chatInterface = new ChatInterface(plugin.settings, view.editor, view);
            plugin.chatInterfaces.set(newFile, chatInterface);
            openInMainEditor(plugin, newFile, chatInterface);
        } catch (e) {
            logger.error(`[Cerebro] Error when creating new chat`, e);
            new Notice(
                `[Cerebro] Error while creating new chat. See console for more details. ${e.message}`,
                ERROR_NOTICE_TIMEOUT_MILLISECONDS,
            );
        }
    },
});
