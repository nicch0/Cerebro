import { type Command, MarkdownView, Notice } from "obsidian";
import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "../constants";
import { logger } from "../logger";
import Cerebro from "../main";
import { openView } from "../utils/chatCreation";

const createChat = async (plugin: Cerebro, chatInMainEditor: boolean) => {
    try {
        const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        const selectedText = activeView?.editor?.getSelection() || "";
        await openView(plugin, chatInMainEditor, selectedText);
    } catch (e) {
        logger.error(`[Cerebro] Error when creating new chat`, e);
        new Notice(
            `[Cerebro] Error while creating new chat. See console for more details. ${e.message}`,
            ERROR_NOTICE_TIMEOUT_MILLISECONDS,
        );
    }
};

export const createNewChatCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-create-new-chat",
    name: "New Chat",
    icon: "message-square-plus",
    callback: async () => createChat(plugin, true),
});

export const createNewChatInSidebarCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-create-new-chat-in-sidebar",
    name: "New Chat in Sidebar",
    icon: "panel-right",
    callback: async () => createChat(plugin, false),
});
