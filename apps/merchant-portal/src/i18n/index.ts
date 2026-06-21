import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN';
import enUS from './en-US';

const LOCALE_KEY = 'acquiring_merchant_locale';
type MerchantLocale = 'zh-CN' | 'en-US';

function getSavedLocale(): MerchantLocale {
    try {
        const stored = localStorage.getItem(LOCALE_KEY);
        return stored === 'en-US' ? 'en-US' : 'zh-CN';
    } catch {
        return 'zh-CN';
    }
}

export function setLocale(locale: MerchantLocale) {
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
    fallbackLocale: 'zh-CN',
    messages: {
        'zh-CN': zhCN,
        'en-US': enUS,
    },
});

document.documentElement.lang = i18n.global.locale.value;

export default i18n;
