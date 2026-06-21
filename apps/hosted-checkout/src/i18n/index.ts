import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN';
import enUS from './en-US';

type CheckoutLocale = 'zh-CN' | 'en-US';
const LOCALE_KEY = 'acquiring_checkout_locale';

function getSavedLocale(): CheckoutLocale {
    try {
        const stored = localStorage.getItem(LOCALE_KEY);
        return stored === 'zh-CN' ? 'zh-CN' : 'en-US';
    } catch {
        return 'en-US';
    }
}

export function setLocale(locale: CheckoutLocale) {
    try {
        localStorage.setItem(LOCALE_KEY, locale);
    } catch {
        // localStorage may be unavailable
    }
    document.documentElement.lang = locale;
    if (i18n.global.locale) {
        i18n.global.locale.value = locale;
    }
}

export const i18n = createI18n({
    legacy: false,
    locale: getSavedLocale(),
    fallbackLocale: 'en-US',
    messages: {
        'zh-CN': zhCN,
        'en-US': enUS,
    },
});

document.documentElement.lang = i18n.global.locale.value;

export default i18n;
