import { App, Modal } from "obsidian";

export class FolderCreationModal extends Modal {
    private result: boolean;
    private folderPath: string;
    private modalPromise: Promise<boolean>;
    private folderDisplayName: string;
    private resolveModalPromise!: (value: boolean) => void;

    constructor(app: App, folderDisplayName: string, folderPath: string) {
        super(app);
        this.folderPath = folderPath;
        this.folderDisplayName = folderDisplayName;
        this.result = false;
        this.modalPromise = new Promise((resolve) => {
            this.resolveModalPromise = resolve;
        });
    }

    public onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl("h6", {
            text: `No ${this.folderDisplayName} folder found at "${this.folderPath}"`,
        });

        contentEl.createEl("p", {
            text: `Create a folder at ${this.folderPath}?\nYou can change this path in settings.`,
        });

        const buttonContainer = contentEl.createEl("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "space-between";

        const createButton = buttonContainer.createEl("button");
        createButton.textContent = "Accept";
        createButton.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.result = true; // This can be any value the user provides.
            this.resolveModalPromise(this.result);
            this.close();
        });

        const cancelButton = buttonContainer.createEl("button");
        cancelButton.textContent = "No, I'll create it myself.";
        cancelButton.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.result = false; // This can be any value the user provides.
            this.resolveModalPromise(this.result);
            this.close();
        });
    }

    public waitForModalValue(): Promise<boolean> {
        return this.modalPromise;
    }

    public onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
