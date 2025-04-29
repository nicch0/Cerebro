import { type Command } from "obsidian";
import { checkForChatFolderCreation, getDate } from "../helpers";
import Cerebro from "../main";
import { ChatTemplatesHandler } from "../views/chatTemplates";

export const chooseChatTemplateCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-choose-chat-template",
    name: "Create new chat from template",
    icon: "layout-template",
    callback: async (): Promise<void> => {
        checkForChatFolderCreation(plugin);
        new ChatTemplatesHandler(
            plugin.app,
            plugin.settings,
            getDate(new Date(), plugin.settings.dateFormat),
        ).open();
    },
});
