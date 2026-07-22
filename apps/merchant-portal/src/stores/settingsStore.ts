import { defineStore } from 'pinia';
import { DEFAULT_SETTINGS, SETTINGS_KEY, normalizeNavigationTheme, type AppSettings } from '@/constants/app';

function normalizeSettings(value: unknown): AppSettings {
    const source = value && typeof value === 'object' ? value as Partial<AppSettings> : {};
    const layoutMode = source.layoutMode === 'top' ? 'top' : DEFAULT_SETTINGS.layoutMode;
    const tagsViewStyle = source.tagsViewStyle === 'google' ? 'google' : DEFAULT_SETTINGS.tagsViewStyle;

    return {
        ...DEFAULT_SETTINGS,
        ...source,
        sideTheme: normalizeNavigationTheme(source.sideTheme),
        layoutMode,
        tagsViewStyle,
        fixedHeader: typeof source.fixedHeader === 'boolean' ? source.fixedHeader : DEFAULT_SETTINGS.fixedHeader,
        showLogo: typeof source.showLogo === 'boolean' ? source.showLogo : DEFAULT_SETTINGS.showLogo,
        showTagsView: typeof source.showTagsView === 'boolean' ? source.showTagsView : DEFAULT_SETTINGS.showTagsView,
        showFooter: typeof source.showFooter === 'boolean' ? source.showFooter : DEFAULT_SETTINGS.showFooter,
    };
}

function loadSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            return normalizeSettings(JSON.parse(raw));
        }
    } catch {
        localStorage.removeItem(SETTINGS_KEY);
    }
    return { ...DEFAULT_SETTINGS };
}

function persist(settings: AppSettings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // localStorage may be unavailable in restricted browser contexts.
    }
}

export const useSettingsStore = defineStore('merchantSettings', {
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
            this.settings[key] = key === 'sideTheme'
                ? normalizeNavigationTheme(value) as AppSettings[K]
                : value;
            persist(this.settings);
        },
        resetSettings() {
            this.settings = { ...DEFAULT_SETTINGS };
            persist(this.settings);
        },
    },
});
