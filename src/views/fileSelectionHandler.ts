import { App, FuzzySuggestModal, Notice, TFile, TFolder } from "obsidian";
import type { CerebroSettings } from "@/settings";

export class FileSelectionHandler extends FuzzySuggestModal<TFile> {
    // private onChooseFile: (file: TFile) => void;
    // constructor(app: App, chatFiles: TFile[], onChooseFile: (file: TFile) => void) {
    //     super(app);
    //     this.onChooseFile = onChooseFile;
    // }
    // getItems(): TFile[] {
    //     return this.chatFiles.sort((a, b) => {
    //         const getEpoch = (file: TFile) => {
    //             const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    //             return frontmatter && frontmatter.epoch ? frontmatter.epoch : file.stat.ctime;
    //         };
    //         const epochA = getEpoch(a);
    //         const epochB = getEpoch(b);
    //         // Sort in descending order (most recent first)
    //         return epochB - epochA;
    //     });
    // }
    // getItemText(file: TFile): string {
    //     // Remove {$date} and {$time} parts from the filename
    //     const title = file.basename
    //         .replace(/\{\$date}|\d{8}/g, "") // Remove {$date} or date in format YYYYMMDD
    //         .replace(/\{\$time}|\d{6}/g, "") // Remove {$time} or time in format HHMMSS
    //         .replace(/[@_]/g, " ") // Replace @ and _ with spaces
    //         .replace(/\s+/g, " ") // Replace multiple spaces with single space
    //         .trim();
    //     let formattedDateTime: FormattedDateTime;
    //     // Read the file's front matter
    //     const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    //     if (frontmatter && frontmatter.epoch) {
    //         // Use the epoch from front matter if available
    //         formattedDateTime = formatDateTime(new Date(frontmatter.epoch));
    //     } else {
    //         // Fallback to file creation time if epoch is not in front matter
    //         formattedDateTime = formatDateTime(new Date(file.stat.ctime));
    //     }
    //     return `${title} - ${formattedDateTime.display}`;
    // }
    // onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent) {
    //     this.onChooseFile(file);
    // }
    //     public readonly settings: CerebroSettings;
    private readonly settings: CerebroSettings;
    private readonly conversationFiles: TFile[];
    private onChooseFile: (file: TFile) => void;

    constructor(app: App, settings: CerebroSettings, onChooseFile: (file: TFile) => void) {
        super(app);
        this.settings = settings;
        this.conversationFiles = this.getFilesInChatFolder();
        this.onChooseFile = onChooseFile;
    }

    public getItems(): TFile[] {
        return this.conversationFiles.sort((a, b) => {
            const getEpoch = (file: TFile): number => {
                const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
                return frontmatter && frontmatter.epoch ? frontmatter.epoch : file.stat.ctime;
            };
            const epochA = getEpoch(a);
            const epochB = getEpoch(b);
            // Sort in descending order (most recent first)
            return epochB - epochA;
        });
    }

    public getItemText(file: TFile): string {
        return file.basename;
    }

    public getFilesInChatFolder(): TFile[] {
        const folder = this.app.vault.getAbstractFileByPath(this.settings.chatFolder) as TFolder;
        if (folder !== null) {
            return folder.children as TFile[];
        }
        new Notice(`Error getting folder: ${this.settings.chatFolder}`);
        throw new Error(`Error getting folder: ${this.settings.chatFolder}`);
    }

    public onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent) {
        this.onChooseFile(file);
    }
}
