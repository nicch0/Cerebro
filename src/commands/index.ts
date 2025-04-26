import type { Command } from "obsidian";
import Cerebro from "../main";
import { chatCommand } from "./chat";
import { inferTitleCommand } from "./inferTitle";
import { createNewChatCommand, createNewChatInSidebarCommand } from "./newChat";
import { chooseChatTemplateCommand } from "./template";

export const getCommands = (plugin: Cerebro): Command[] => [
    createNewChatCommand(plugin),
    createNewChatInSidebarCommand(plugin),
    chatCommand(plugin),
    inferTitleCommand(plugin),
    chooseChatTemplateCommand(plugin),
];
