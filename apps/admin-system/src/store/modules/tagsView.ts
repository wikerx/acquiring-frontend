import { defineStore } from 'pinia';

export interface VisitedView {
    path: string;
    title: string;
    titleKey?: string;
    icon?: string;
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
            if (index >= 0) {
                this.visitedViews.splice(index, 1, view);
            } else {
                this.visitedViews.push(view);
            }
        },
        removeView(path: string) {
            const index = this.visitedViews.findIndex((v) => v.path === path);
            if (index >= 0) {
                this.visitedViews.splice(index, 1);
            }
        },
        clearOthers(path: string) {
            this.visitedViews = this.visitedViews.filter(
                (v) => v.path === path || v.path === '/dashboard',
            );
        },
        clearAll() {
            this.visitedViews = this.visitedViews.filter((v) => v.path === '/dashboard');
        },
    },
});
