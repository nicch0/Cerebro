import { Notice, TFile, WorkspaceLeaf } from "obsidian";
import { ChatView } from "@/views/ChatView.svelte";
import { createFolderModal, getDate } from "../helpers";
import Cerebro from "../main";
import { generateChatFrontmatter } from "../settings";

export const validateAndCreateChatFolder = async (plugin: Cerebro): Promise<boolean> => {
    if (!plugin.settings.chatFolder || plugin.settings.chatFolder.trim() === "") {
        new Notice("No chat folder specified. Please set one in settings.");
        return false;
    }

    if (!(await plugin.app.vault.adapter.exists(plugin.settings.chatFolder))) {
        const result = await createFolderModal(
            plugin.app,
            plugin.app.vault,
            "chatFolder",
            plugin.settings.chatFolder,
        );
        if (!result) {
            new Notice("No chat folder found. Please set one in settings.");
            return false;
        }
    }
    return true;
};

export const createNewChatFile = async (
    plugin: Cerebro,
    selectedText: string,
): Promise<TFile | null> => {
    const folderValid = await validateAndCreateChatFolder(plugin);
    if (!folderValid) {
        return null;
    }

    const filePath = `${plugin.settings.chatFolder}/${getDate(
        new Date(),
        plugin.settings.dateFormat,
    )}.md`;

    const frontmatter = generateChatFrontmatter(plugin.settings);
    const fileContent = `${frontmatter}${selectedText}\n`;

    return plugin.app.vault.create(filePath, fileContent);
};

export const openView = async (
    plugin: Cerebro,
    inMainEditor: boolean,
    selectedText?: string,
): Promise<void> => {
    const { workspace } = plugin.app;

    const leaf: WorkspaceLeaf | null = inMainEditor
        ? workspace.getLeaf(true)
        : workspace.getRightLeaf(false);
    if (!leaf) {
        return;
    }

    const newView = await ChatView.create(leaf, plugin, selectedText);
    leaf.open(newView);
    workspace.revealLeaf(leaf);
};
