import { Notice, TFile, WorkspaceLeaf } from "obsidian";
import { CEREBRO_CHAT_VIEW, ChatView } from "@/views/ChatView.svelte";
import { createFolderModal, getDate } from "../helpers";
import Cerebro from "../main";

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

/**
 * Create a new chat file with frontmatter
 * @returns
 */
export const createNewChatFile = async (plugin: Cerebro): Promise<TFile | null> => {
    const folderValid = await validateAndCreateChatFolder(plugin);
    if (!folderValid) {
        throw new Error("Failed to create chat folder");
    }

    const filePath = `${plugin.settings.chatFolder}/${getDate(
        new Date(),
        plugin.settings.dateFormat,
    )}.md`;

    const file = plugin.app.vault.create(filePath, "");

    if (!file) {
        throw new Error("Failed to create chat file");
    }

    return file;
};

export const openView = async (
    plugin: Cerebro,
    inMainEditor: boolean,
    selectedText?: string,
    file?: TFile,
): Promise<void> => {
    const { workspace } = plugin.app;

    const leaf: WorkspaceLeaf | null = inMainEditor
        ? workspace.getLeaf(true)
        : workspace.getRightLeaf(false);
    if (!leaf) {
        return;
    }

    const newView = new ChatView(leaf, plugin, selectedText, file);
    leaf.open(newView);
    leaf.setViewState({
        type: CEREBRO_CHAT_VIEW,
        active: true,
        state: { viewTitle: newView.getDisplayText() },
    });
    workspace.revealLeaf(leaf);
};
