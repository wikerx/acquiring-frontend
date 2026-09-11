import { defineStore } from 'pinia';
import {
    APPEARANCE_PRESET_OPTIONS,
    DEFAULT_SETTINGS,
    SETTINGS_KEY,
    inferAppearancePreset,
    normalizeNavigationTheme,
    type AppSettings,
    type SelectableAppearancePreset,
} from '@/constants/app';

function loadSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            return normalizeSettings(JSON.parse(raw));
        }
    } catch {
        // corrupted data, fall through to defaults
    }
    return { ...DEFAULT_SETTINGS };
}

function normalizeSettings(value: unknown): AppSettings {
    const source = value && typeof value === 'object' ? value as Partial<AppSettings> : {};
    const layoutMode = source.layoutMode === 'top' ? 'top' : DEFAULT_SETTINGS.layoutMode;
    const tagsViewStyle = source.tagsViewStyle === 'google' ? 'google' : DEFAULT_SETTINGS.tagsViewStyle;
    const themeColor = typeof source.themeColor === 'string' ? source.themeColor : DEFAULT_SETTINGS.themeColor;
    const sideTheme = normalizeNavigationTheme(source.sideTheme);
    return {
        ...DEFAULT_SETTINGS,
        ...source,
        appearancePreset: inferAppearancePreset(themeColor, sideTheme),
        themeColor,
        sideTheme,
        layoutMode,
        tagsViewStyle,
        fixedHeader: typeof source.fixedHeader === 'boolean' ? source.fixedHeader : DEFAULT_SETTINGS.fixedHeader,
        showLogo: typeof source.showLogo === 'boolean' ? source.showLogo : DEFAULT_SETTINGS.showLogo,
        showTagsView: typeof source.showTagsView === 'boolean' ? source.showTagsView : DEFAULT_SETTINGS.showTagsView,
        showFooter: typeof source.showFooter === 'boolean' ? source.showFooter : DEFAULT_SETTINGS.showFooter,
    };
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
        appearancePreset: (state) => state.settings.appearancePreset,
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
            if (key === 'themeColor' || key === 'sideTheme') {
                this.settings.appearancePreset = inferAppearancePreset(this.settings.themeColor, this.settings.sideTheme);
            }
            persist(this.settings);
        },
        applyAppearancePreset(preset: SelectableAppearancePreset) {
            const option = APPEARANCE_PRESET_OPTIONS.find((item) => item.key === preset);
            if (!option) {
                return;
            }
            this.settings.appearancePreset = option.key;
            this.settings.themeColor = option.primary;
            this.settings.sideTheme = option.navigationTheme;
            persist(this.settings);
        },
        resetSettings() {
            this.settings = { ...DEFAULT_SETTINGS };
            persist(this.settings);
        },
    },
});
