import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN';
import enUS from './en-US';

const LOCALE_KEY = 'acquiring_admin_locale';

function normalizeLocale(locale: string | null | undefined): string {
    if (locale === 'zh') {
        return 'zh-CN';
    }
    if (locale === 'en') {
        return 'en-US';
    }
    return locale || 'zh-CN';
}

function getSavedLocale(): string {
    try {
        return normalizeLocale(localStorage.getItem(LOCALE_KEY));
    } catch {
        return 'zh-CN';
    }
}

export function setLocale(locale: string) {
    const normalizedLocale = normalizeLocale(locale);
    try {
        localStorage.setItem(LOCALE_KEY, normalizedLocale);
    } catch { /* localStorage may be unavailable */ }
    if (i18n.global.locale) {
        (i18n.global.locale as any).value = normalizedLocale;
    }
}

export const i18n = createI18n({
    legacy: false,
    locale: getSavedLocale(),
    fallbackLocale: 'zh-CN',
    messages: {
        zh: zhCN,
        'zh-CN': zhCN,
        en: enUS,
        'en-US': enUS,
    },
});

export default i18n;
