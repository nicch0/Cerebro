import type { MarkdownView } from "obsidian";
import type Cerebro from "./main";
import Overlay from "./views/Overlay";

export class OverlayManager {
    private plugin: Cerebro;
    public overlays: Map<string, Overlay>;

    constructor(plugin: Cerebro) {
        this.plugin = plugin;
        this.overlays = new Map();
    }

    getVisibleMDViews(): MarkdownView[] {
        const views: MarkdownView[] = this.plugin.app.workspace
            .getLeavesOfType("markdown")
            .map((leaf) => leaf.view as MarkdownView)
            .filter((view) => view.contentEl);
        return views;
    }

    createButtonInView(view: MarkdownView): void {
        const overlay = new Overlay(this.plugin, view);
        // @ts-ignore:2239
        this.overlays.set(view.leaf.id, overlay);
        overlay.showButton();
    }

    public createButtonsInOpenViews(): void {
        const views: MarkdownView[] = this.getVisibleMDViews();
        if (views.length === 0) return;

        views.map((view) => this.createButtonInView(view));
    }

    public removeAll(): void {
        this.overlays.forEach((overlay: Overlay) => {
            overlay.button.destroy();
        });
        this.overlays.clear();
    }
}
