import { defineStore } from 'pinia';

export interface VisitedView {
    path: string;
    title: string;
}

export const useTagsViewStore = defineStore('tagsView', {
    state: () => ({
        visitedViews: [{ path: '/dashboard', title: '首页' }] as VisitedView[],
    }),
    actions: {
        addView(view: VisitedView) {
            if (!this.visitedViews.some((item) => item.path === view.path)) {
                this.visitedViews.push(view);
            }
        },
        removeView(path: string) {
            if (path === '/dashboard') {
                return;
            }
            this.visitedViews = this.visitedViews.filter((item) => item.path !== path);
        },
        clearOthers(path: string) {
            this.visitedViews = this.visitedViews.filter(
                (item) => item.path === '/dashboard' || item.path === path,
            );
        },
    },
});
