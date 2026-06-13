import { defineStore } from 'pinia';
import { DEFAULT_SETTINGS, SETTINGS_KEY, type AppSettings } from '@/constants/app';

function loadSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        }
    } catch {
        // corrupted data, fall through to defaults
    }
    return { ...DEFAULT_SETTINGS };
}

function persist(settings: AppSettings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // localStorage may be unavailable
    }
}

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        settings: loadSettings(),
    }),
    getters: {
        themeColor: (state) => state.settings.themeColor,
        sideTheme: (state) => state.settings.sideTheme,
        layoutMode: (state) => state.settings.layoutMode,
        fixedHeader: (state) => state.settings.fixedHeader,
        showLogo: (state) => state.settings.showLogo,
        showTagsView: (state) => state.settings.showTagsView,
        tagsViewStyle: (state) => state.settings.tagsViewStyle,
        showFooter: (state) => state.settings.showFooter,
    },
    actions: {
        updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
            this.settings[key] = value;
            persist(this.settings);
        },
        resetSettings() {
            this.settings = { ...DEFAULT_SETTINGS };
            persist(this.settings);
        },
    },
});
