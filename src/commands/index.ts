import type { Command } from "obsidian";
import Cerebro from "../main";
import { inferTitleCommand } from "./inferTitle";
import { loadExistingChatCommand } from "./loadChat";
import { createNewChatCommand, createNewChatInSidebarCommand } from "./newChat";
import { chooseChatTemplateCommand } from "./newChatFromTemplate";

export const getCommands = (plugin: Cerebro): Command[] => [
    createNewChatCommand(plugin),
    createNewChatInSidebarCommand(plugin),
    inferTitleCommand(plugin),
    chooseChatTemplateCommand(plugin),
    loadExistingChatCommand(plugin),
];
