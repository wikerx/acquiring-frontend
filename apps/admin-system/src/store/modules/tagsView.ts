import { defineStore } from 'pinia';

export interface VisitedView {
    path: string;
    title: string;
    titleKey?: string;
    icon?: string;
    pinned?: boolean;
}

export const useTagsViewStore = defineStore('tagsView', {
    state: () => ({
        visitedViews: [] as VisitedView[],
    }),
    actions: {
        addView(view: VisitedView) {
            if (view.path === '/403') {
                return;
            }
            const index = this.visitedViews.findIndex((v) => v.path === view.path);
            const normalizedView = {
                ...view,
                pinned: view.path === '/dashboard' || this.visitedViews[index]?.pinned || false,
            };
            if (index >= 0) {
                this.visitedViews.splice(index, 1, normalizedView);
            } else {
                this.visitedViews.push(normalizedView);
            }
            this.sortPinnedViews();
        },
        removeView(path: string) {
            const index = this.visitedViews.findIndex((v) => v.path === path);
            if (index >= 0 && !this.visitedViews[index].pinned) {
                this.visitedViews.splice(index, 1);
                return true;
            }
            return false;
        },
        pinView(path: string) {
            const view = this.visitedViews.find((item) => item.path === path);
            if (!view) return;
            view.pinned = true;
            this.sortPinnedViews();
        },
        unpinView(path: string) {
            const view = this.visitedViews.find((item) => item.path === path);
            if (!view || path === '/dashboard') return;
            view.pinned = false;
            this.sortPinnedViews();
        },
        clearOthers(path: string) {
            this.visitedViews = this.visitedViews.filter(
                (v) => v.path === path || v.pinned,
            );
        },
        clearLeft(path: string) {
            const index = this.visitedViews.findIndex((v) => v.path === path);
            if (index < 0) return;
            this.visitedViews = this.visitedViews.filter((view, viewIndex) => viewIndex >= index || view.pinned);
        },
        clearRight(path: string) {
            const index = this.visitedViews.findIndex((v) => v.path === path);
            if (index < 0) return;
            this.visitedViews = this.visitedViews.filter((view, viewIndex) => viewIndex <= index || view.pinned);
        },
        clearAll() {
            this.visitedViews = this.visitedViews.filter((v) => v.pinned);
        },
        sortPinnedViews() {
            this.visitedViews = [
                ...this.visitedViews.filter((view) => view.pinned),
                ...this.visitedViews.filter((view) => !view.pinned),
            ];
        },
    },
});
