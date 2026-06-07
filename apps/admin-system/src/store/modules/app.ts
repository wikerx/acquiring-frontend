import { defineStore } from 'pinia';
import { DEFAULT_THEME } from '@/constants/app';

export const useAppStore = defineStore('app', {
    state: () => ({
        sidebarCollapsed: false,
        themeColor: DEFAULT_THEME,
    }),
    actions: {
        toggleSidebar() {
            this.sidebarCollapsed = !this.sidebarCollapsed;
        },
        setSidebarCollapsed(collapsed: boolean) {
            this.sidebarCollapsed = collapsed;
        },
        setThemeColor(color: string) {
            this.themeColor = color;
        },
    },
});
