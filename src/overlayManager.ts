import type { MarkdownView } from "obsidian";
import type Cerebro from "./main";
import Overlay from "./views/Overlay.svelte";

// Type definition for selection range
export interface SelectionRange {
    from: number;
    to: number;
}

export class OverlayManager {
    private plugin: Cerebro;
    public overlays: Map<string, Overlay>;

    constructor(plugin: Cerebro) {
        this.plugin = plugin;
        this.overlays = new Map();
    }

    public handleActiveLeafChange(view: MarkdownView) {
        this._updateOverlayVisibility(view);
    }

    public updateViewForOverlay(view: MarkdownView) {
        const overlay = this.getOverlayInView(view);
        overlay.view = view;
    }

    private _updateOverlayVisibility(view: MarkdownView, isMetadataChange = false): void {
        const overlay: Overlay = this.getOverlayInView(view);

        // Update button visibility
        overlay.toggleButton(true);
    }

    private _getViewId(view: MarkdownView): string {
        // @ts-ignore:2239
        return view.leaf.id;
    }

    private getOverlayInView(view: MarkdownView): Overlay {
        const viewId: string = this._getViewId(view);
        if (!this.overlays.has(viewId)) {
            this.overlays.set(viewId, new Overlay(this.plugin, view));
        }

        return this.overlays.get(viewId)!;
    }

    public getVisibleMDViews(): MarkdownView[] {
        const views: MarkdownView[] = this.plugin.app.workspace
            .getLeavesOfType("markdown")
            .map((leaf) => leaf.view as MarkdownView)
            .filter((view) => view.contentEl);
        return views;
    }

    public createButtonInView(view: MarkdownView): void {
        const overlay = new Overlay(this.plugin, view);
        this.overlays.set(this._getViewId(view), overlay);
        overlay.showButton();
    }

    public createButtonsInOpenViews(): void {
        const views: MarkdownView[] = this.getVisibleMDViews();
        if (views.length === 0) {
            return;
        }

        views.map((view) => this.createButtonInView(view));
    }

    public removeAll(): void {
        this.overlays.forEach((overlay: Overlay) => {
            overlay.destroy();
        });
        this.overlays.clear();
    }
}
