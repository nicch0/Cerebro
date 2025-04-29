import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "@/constants";
import { logger } from "@/logger";
import type Cerebro from "@/main";
import { type Command, Notice } from "obsidian";

export const loadExistingChatCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-load-chat",
    name: "Load Chat",
    icon: "message-square",
    callback: async () => {
        try {
            // Open modal to select file
            // Create new view based on file
            // Open file
            // await openView(plugin, plugin, selectedText);
        } catch (e) {
            logger.error(`[Cerebro] Error when creating new chat`, e.message);
            new Notice(
                `[Cerebro] Error while creating new chat. See console for more details. ${e.message}`,
                ERROR_NOTICE_TIMEOUT_MILLISECONDS,
            );
        }
    },
});
