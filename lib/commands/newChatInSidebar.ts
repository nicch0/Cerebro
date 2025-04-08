import { Command, MarkdownView, Notice } from "obsidian";
import ChatInterface from "../chatInterface";
import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "../constants";
import { logger } from "../logger";
import Cerebro from "../main";
import { createNewChatFile, openInSidebar } from "./chatCreation";

export const createNewChatInSidebarCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-create-new-chat-in-sidebar",
    name: "New Chat in Sidebar",
    icon: "panel-right",
    callback: async () => {
        try {
            const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
            const selectedText = activeView?.editor?.getSelection() || "";
            const newFile = await createNewChatFile(plugin, selectedText);
            if (!newFile) return;
            openInSidebar(plugin, newFile);
        } catch (e) {
            logger.error(`[Cerebro] Error when creating new chat`, e);
            new Notice(
                `[Cerebro] Error while creating new chat. See console for more details. ${e.message}`,
                ERROR_NOTICE_TIMEOUT_MILLISECONDS,
            );
        }
    },
});
