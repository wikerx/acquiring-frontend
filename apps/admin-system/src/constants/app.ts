export const APP_TITLE = 'Acquiring Admin';

/* ===== Theme Presets ===== */
export const DEFAULT_THEME = '#409EFF';

export const PRESET_COLORS = [
    '#409EFF', // 蓝
    '#67C23A', // 绿
    '#E6A23C', // 黄
    '#F56C6C', // 红
    '#9C27B0', // 紫
    '#607D8B', // 蓝灰
    '#4CAF50', // 绿深
    '#FF9800', // 橙
    '#00BCD4', // 青
    '#795548', // 棕
    '#1890FF', // 天蓝
    '#52C41A', // 亮绿
];

/* ===== Default App Settings ===== */
export interface AppSettings {
    themeColor: string;
    sideTheme: 'dark' | 'light';
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
