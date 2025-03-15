import { App, Modal, Setting } from "obsidian";

export class FolderCreationModal extends Modal {
	private result: boolean;
	private folderName: string;
	private folderPath: string;
	private modalPromise: Promise<boolean>;
	private resolveModalPromise: (value: boolean) => void;

	constructor(app: App, folderName: string, folderPath: string) {
		super(app);
		this.folderName = folderName;
		this.folderPath = folderPath;

		this.result = false;
		this.modalPromise = new Promise((resolve) => {
			this.resolveModalPromise = resolve;
		});
	}

	public onOpen(): void {
		const { contentEl } = this;

		contentEl.createEl("h2", {
			text: `[Cerebro] No ${this.folderName} folder found.`,
		});

		contentEl.createEl("p", {
			text: `If you choose "Yes, Create", the plugin will automatically create a folder at: ${this.folderPath}. You can change this path in the plugin settings.`,
		});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Yes, Create Folder")
				.setTooltip("Create folder")
				.setCta()
				.onClick(() => {
					this.result = true; // This can be any value the user provides.
					this.resolveModalPromise(this.result);
					this.close();
				}),
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("No, I'll create it myself")
				.setTooltip("Cancel")
				.setCta()
				.onClick(() => {
					this.result = false; // This can be any value the user provides.
					this.resolveModalPromise(this.result);
					this.close();
				}),
		);
	}

	public waitForModalValue(): Promise<boolean> {
		return this.modalPromise;
	}

	public onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
