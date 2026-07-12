import { VEXRA_BRAND } from '@acquiring/shared';

export const APP_TITLE = VEXRA_BRAND.systems.admin.title;

/* ===== Theme Presets ===== */
export const DEFAULT_THEME = VEXRA_BRAND.systems.admin.accentColor;

export const PRESET_COLORS = [
    '#2563EB',
    '#1677FF',
    '#4F46E5',
    '#0891B2',
    '#0F766E',
    '#16A34A',
    '#65A30D',
    '#D97706',
    '#EA580C',
    '#DC2626',
    '#E11D48',
    '#9333EA',
    '#7C3AED',
    '#475569',
];

export type NavigationTheme =
    | 'light'
    | 'mist'
    | 'dark'
    | 'blue'
    | 'navy'
    | 'graphite'
    | 'cyan'
    | 'forest'
    | 'purple'
    | 'dusk';

export interface NavigationThemeTokens {
    key: NavigationTheme;
    labelKey: string;
    previewColors: {
        shell: string;
        bar: string;
        active: string;
        accent: string;
    };
    navBg: string;
    navBgElevated: string;
    navText: string;
    navTextMuted: string;
    navIcon: string;
    navHoverBg: string;
    navHoverText: string;
    navActiveBg: string;
    navActiveText: string;
    navActiveIcon: string;
    navActiveIndicator: string;
    navBorder: string;
    dropdownBg: string;
    dropdownText: string;
    dropdownHoverBg: string;
    dropdownHoverText: string;
    dropdownActiveBg: string;
    dropdownActiveText: string;
    shadow: string;
}

export const NAVIGATION_THEME_OPTIONS: NavigationThemeTokens[] = [
    {
        key: 'light',
        labelKey: 'settings.sideThemeLight',
        previewColors: { shell: '#f8fafc', bar: '#ffffff', active: '#e8f0ff', accent: '#2563eb' },
        navBg: '#ffffff',
        navBgElevated: '#f8fafc',
        navText: '#334155',
        navTextMuted: '#64748b',
        navIcon: '#64748b',
        navHoverBg: '#eff6ff',
        navHoverText: '#1d4ed8',
        navActiveBg: '#e8f0ff',
        navActiveText: '#2563eb',
        navActiveIcon: '#2563eb',
        navActiveIndicator: '#2563eb',
        navBorder: '#e2e8f0',
        dropdownBg: '#ffffff',
        dropdownText: '#334155',
        dropdownHoverBg: '#eff6ff',
        dropdownHoverText: '#1d4ed8',
        dropdownActiveBg: '#e8f0ff',
        dropdownActiveText: '#2563eb',
        shadow: '0 12px 30px rgb(15 23 42 / 8%)',
    },
    {
        key: 'mist',
        labelKey: 'settings.sideThemeMist',
        previewColors: { shell: '#f5f8ff', bar: '#edf3ff', active: '#dce8ff', accent: '#3b82f6' },
        navBg: '#f5f8ff',
        navBgElevated: '#edf3ff',
        navText: '#334155',
        navTextMuted: '#64748b',
        navIcon: '#475569',
        navHoverBg: '#e3ecff',
        navHoverText: '#1d4ed8',
        navActiveBg: '#dce8ff',
        navActiveText: '#1d4ed8',
        navActiveIcon: '#1d4ed8',
        navActiveIndicator: '#3b82f6',
        navBorder: '#dbe7ff',
        dropdownBg: '#ffffff',
        dropdownText: '#334155',
        dropdownHoverBg: '#e3ecff',
        dropdownHoverText: '#1d4ed8',
        dropdownActiveBg: '#dce8ff',
        dropdownActiveText: '#1d4ed8',
        shadow: '0 14px 32px rgb(29 78 216 / 10%)',
    },
    {
        key: 'dark',
        labelKey: 'settings.sideThemeDark',
        previewColors: { shell: '#0b1739', bar: '#111f46', active: '#1b326a', accent: '#3b82f6' },
        navBg: '#0b1739',
        navBgElevated: '#111f46',
        navText: '#dce7ff',
        navTextMuted: '#93a4c7',
        navIcon: '#b7c7ea',
        navHoverBg: '#172a57',
        navHoverText: '#ffffff',
        navActiveBg: '#1b326a',
        navActiveText: '#ffffff',
        navActiveIcon: '#ffffff',
        navActiveIndicator: '#3b82f6',
        navBorder: 'rgb(147 164 199 / 22%)',
        dropdownBg: '#111f46',
        dropdownText: '#dce7ff',
        dropdownHoverBg: '#172a57',
        dropdownHoverText: '#ffffff',
        dropdownActiveBg: '#1b326a',
        dropdownActiveText: '#ffffff',
        shadow: '0 18px 38px rgb(3 7 18 / 28%)',
    },
    {
        key: 'blue',
        labelKey: 'settings.sideThemeBlue',
        previewColors: { shell: '#073b5c', bar: '#0a4a70', active: '#126d9b', accent: '#38bdf8' },
        navBg: '#073b5c',
        navBgElevated: '#0a4a70',
        navText: '#e8f7ff',
        navTextMuted: '#a8d4e8',
        navIcon: '#bae6fd',
        navHoverBg: '#0c5d88',
        navHoverText: '#ffffff',
        navActiveBg: '#126d9b',
        navActiveText: '#ffffff',
        navActiveIcon: '#ffffff',
        navActiveIndicator: '#38bdf8',
        navBorder: 'rgb(168 212 232 / 22%)',
        dropdownBg: '#0a4a70',
        dropdownText: '#e8f7ff',
        dropdownHoverBg: '#0c5d88',
        dropdownHoverText: '#ffffff',
        dropdownActiveBg: '#126d9b',
        dropdownActiveText: '#ffffff',
        shadow: '0 18px 36px rgb(3 43 68 / 30%)',
    },
    {
        key: 'navy',
        labelKey: 'settings.sideThemeNavy',
        previewColors: { shell: '#172033', bar: '#202b40', active: '#324463', accent: '#5b8cff' },
        navBg: '#172033',
        navBgElevated: '#202b40',
        navText: '#e7ecf5',
        navTextMuted: '#a2aec2',
        navIcon: '#c3cbda',
        navHoverBg: '#293750',
        navHoverText: '#ffffff',
        navActiveBg: '#324463',
        navActiveText: '#ffffff',
        navActiveIcon: '#ffffff',
        navActiveIndicator: '#5b8cff',
        navBorder: 'rgb(162 174 194 / 20%)',
        dropdownBg: '#202b40',
        dropdownText: '#e7ecf5',
        dropdownHoverBg: '#293750',
        dropdownHoverText: '#ffffff',
        dropdownActiveBg: '#324463',
        dropdownActiveText: '#ffffff',
        shadow: '0 18px 36px rgb(8 13 24 / 28%)',
    },
    {
        key: 'graphite',
        labelKey: 'settings.sideThemeGraphite',
        previewColors: { shell: '#171a21', bar: '#20242d', active: '#323a48', accent: '#60a5fa' },
        navBg: '#171a21',
        navBgElevated: '#20242d',
        navText: '#e8eaf0',
        navTextMuted: '#9ca3af',
        navIcon: '#cbd5e1',
        navHoverBg: '#2a303b',
        navHoverText: '#ffffff',
        navActiveBg: '#323a48',
        navActiveText: '#ffffff',
        navActiveIcon: '#ffffff',
        navActiveIndicator: '#60a5fa',
        navBorder: 'rgb(156 163 175 / 20%)',
        dropdownBg: '#20242d',
        dropdownText: '#e8eaf0',
        dropdownHoverBg: '#2a303b',
        dropdownHoverText: '#ffffff',
        dropdownActiveBg: '#323a48',
        dropdownActiveText: '#ffffff',
        shadow: '0 18px 38px rgb(0 0 0 / 28%)',
    },
    {
        key: 'cyan',
        labelKey: 'settings.sideThemeCyan',
        previewColors: { shell: '#0f4c45', bar: '#155e54', active: '#22796d', accent: '#2dd4bf' },
        navBg: '#0f4c45',
        navBgElevated: '#155e54',
        navText: '#e8fff9',
        navTextMuted: '#a7d6cc',
        navIcon: '#bff2e8',
        navHoverBg: '#1d6b60',
        navHoverText: '#ffffff',
        navActiveBg: '#22796d',
        navActiveText: '#ffffff',
        navActiveIcon: '#ffffff',
        navActiveIndicator: '#2dd4bf',
        navBorder: 'rgb(167 214 204 / 22%)',
        dropdownBg: '#155e54',
        dropdownText: '#e8fff9',
        dropdownHoverBg: '#1d6b60',
        dropdownHoverText: '#ffffff',
        dropdownActiveBg: '#22796d',
        dropdownActiveText: '#ffffff',
        shadow: '0 18px 36px rgb(6 49 44 / 30%)',
    },
    {
        key: 'forest',
        labelKey: 'settings.sideThemeForest',
        previewColors: { shell: '#173c34', bar: '#1e4b41', active: '#306d5e', accent: '#34d399' },
        navBg: '#173c34',
        navBgElevated: '#1e4b41',
        navText: '#e6f6f1',
        navTextMuted: '#a6c9bf',
        navIcon: '#b7dacf',
        navHoverBg: '#285c50',
        navHoverText: '#ffffff',
        navActiveBg: '#306d5e',
        navActiveText: '#ffffff',
        navActiveIcon: '#ffffff',
        navActiveIndicator: '#34d399',
        navBorder: 'rgb(166 201 191 / 22%)',
        dropdownBg: '#1e4b41',
        dropdownText: '#e6f6f1',
        dropdownHoverBg: '#285c50',
        dropdownHoverText: '#ffffff',
        dropdownActiveBg: '#306d5e',
        dropdownActiveText: '#ffffff',
        shadow: '0 18px 36px rgb(9 45 38 / 30%)',
    },
    {
        key: 'purple',
        labelKey: 'settings.sideThemePurple',
        previewColors: { shell: '#2e1f47', bar: '#3a2859', active: '#594083', accent: '#a78bfa' },
        navBg: '#2e1f47',
        navBgElevated: '#3a2859',
        navText: '#f1eafe',
        navTextMuted: '#bdafd6',
        navIcon: '#ddd6fe',
        navHoverBg: '#49346d',
        navHoverText: '#ffffff',
        navActiveBg: '#594083',
        navActiveText: '#ffffff',
        navActiveIcon: '#ffffff',
        navActiveIndicator: '#a78bfa',
        navBorder: 'rgb(189 175 214 / 22%)',
        dropdownBg: '#3a2859',
        dropdownText: '#f1eafe',
        dropdownHoverBg: '#49346d',
        dropdownHoverText: '#ffffff',
        dropdownActiveBg: '#594083',
        dropdownActiveText: '#ffffff',
        shadow: '0 18px 36px rgb(28 15 49 / 30%)',
    },
    {
        key: 'dusk',
        labelKey: 'settings.sideThemeDusk',
        previewColors: { shell: '#44312f', bar: '#533c38', active: '#76564e', accent: '#fb923c' },
        navBg: '#44312f',
        navBgElevated: '#533c38',
        navText: '#f8ece8',
        navTextMuted: '#cdb2aa',
        navIcon: '#ead3cc',
        navHoverBg: '#654943',
        navHoverText: '#ffffff',
        navActiveBg: '#76564e',
        navActiveText: '#ffffff',
        navActiveIcon: '#ffffff',
        navActiveIndicator: '#fb923c',
        navBorder: 'rgb(205 178 170 / 22%)',
        dropdownBg: '#533c38',
        dropdownText: '#f8ece8',
        dropdownHoverBg: '#654943',
        dropdownHoverText: '#ffffff',
        dropdownActiveBg: '#76564e',
        dropdownActiveText: '#ffffff',
        shadow: '0 18px 36px rgb(51 31 28 / 28%)',
    },
];

export function normalizeNavigationTheme(value: unknown): NavigationTheme {
    const matched = NAVIGATION_THEME_OPTIONS.find((item) => item.key === value);
    return matched?.key || DEFAULT_SETTINGS.sideTheme;
}

export function navigationThemeCssVariables(theme: NavigationTheme): Record<string, string> {
    const tokens = NAVIGATION_THEME_OPTIONS.find((item) => item.key === theme)
        || NAVIGATION_THEME_OPTIONS.find((item) => item.key === DEFAULT_SETTINGS.sideTheme)
        || NAVIGATION_THEME_OPTIONS[0];
    return {
        '--nav-bg': tokens.navBg,
        '--nav-bg-elevated': tokens.navBgElevated,
        '--nav-text': tokens.navText,
        '--nav-text-muted': tokens.navTextMuted,
        '--nav-icon': tokens.navIcon,
        '--nav-hover-bg': tokens.navHoverBg,
        '--nav-hover-text': tokens.navHoverText,
        '--nav-active-bg': tokens.navActiveBg,
        '--nav-active-text': tokens.navActiveText,
        '--nav-active-icon': tokens.navActiveIcon,
        '--nav-active-indicator': tokens.navActiveIndicator,
        '--nav-border': tokens.navBorder,
        '--nav-dropdown-bg': tokens.dropdownBg,
        '--nav-dropdown-text': tokens.dropdownText,
        '--nav-dropdown-hover-bg': tokens.dropdownHoverBg,
        '--nav-dropdown-hover-text': tokens.dropdownHoverText,
        '--nav-dropdown-active-bg': tokens.dropdownActiveBg,
        '--nav-dropdown-active-text': tokens.dropdownActiveText,
        '--nav-shadow': tokens.shadow,
    };
}

/* ===== Default App Settings ===== */
export interface AppSettings {
    themeColor: string;
    sideTheme: NavigationTheme;
    layoutMode: 'side' | 'top';
    fixedHeader: boolean;
    showLogo: boolean;
    showTagsView: boolean;
    tagsViewStyle: 'card' | 'google';
    showFooter: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    themeColor: DEFAULT_THEME,
    sideTheme: 'light',
    layoutMode: 'side',
    fixedHeader: false,
    showLogo: true,
    showTagsView: true,
    tagsViewStyle: 'card',
    showFooter: true,
};

/** localStorage key for persisting app settings */
export const SETTINGS_KEY = 'acquiring_admin_settings';
