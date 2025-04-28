import type { Command } from "obsidian";
import Cerebro from "../main";
import { inferTitleCommand } from "./inferTitle";
import { createNewChatCommand, createNewChatInSidebarCommand } from "./newChat";
import { chooseChatTemplateCommand } from "./template";

export const getCommands = (plugin: Cerebro): Command[] => [
    createNewChatCommand(plugin),
    createNewChatInSidebarCommand(plugin),
    inferTitleCommand(plugin),
    chooseChatTemplateCommand(plugin),
];
