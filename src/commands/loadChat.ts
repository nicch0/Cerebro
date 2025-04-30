import { openChat } from "@/chat";
import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "@/constants";
import { checkForChatFolderCreation } from "@/helpers";
import { logger } from "@/logger";
import type Cerebro from "@/main";
import { FileSelectionHandler } from "@/views/fileSelectionHandler";
import { type Command, Notice, TFile } from "obsidian";

// TODO: Refactor into all-in-one area to create new conversation, load from template
// or load from existing conversation
export const loadExistingChatCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-load-chat",
    name: "Load conversation",
    icon: "message-square",
    callback: async () => {
        try {
            checkForChatFolderCreation(plugin);
            new FileSelectionHandler(plugin.app, plugin.settings, async (file: TFile) => {
                openChat(plugin, true, file);
            }).open();
        } catch (e) {
            logger.error(`[Cerebro] Error when creating new chat`, e.message);
            new Notice(
                `[Cerebro] Error while creating new chat. See console for more details. ${e.message}`,
                ERROR_NOTICE_TIMEOUT_MILLISECONDS,
            );
        }
    },
});
