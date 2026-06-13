import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN';
import enUS from './en-US';

const LOCALE_KEY = 'acquiring_admin_locale';

function getSavedLocale(): string {
    try {
        return localStorage.getItem(LOCALE_KEY) || 'zh-CN';
    } catch {
        return 'zh-CN';
    }
}

export function setLocale(locale: string) {
    try {
        localStorage.setItem(LOCALE_KEY, locale);
    } catch { /* localStorage may be unavailable */ }
    if (i18n.global.locale) {
        (i18n.global.locale as any).value = locale;
    }
}

export const i18n = createI18n({
    legacy: false,
    locale: getSavedLocale(),
    fallbackLocale: 'zh-CN',
    messages: {
        'zh-CN': zhCN,
        'en-US': enUS,
    },
});

export default i18n;
