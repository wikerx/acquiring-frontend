<template>
    <main class="checkout-shell">
        <header class="checkout-topbar">
            <div class="checkout-topbar__brand">
                <img class="checkout-topbar__logo" :src="checkoutBrand.logos.horizontal" :alt="checkoutBrand.name" />
                <span>{{ checkoutBrand.subtitleEn }}</span>
            </div>
            <div class="checkout-topbar__meta">
                <label class="checkout-topbar__locale">
                    <span>{{ t('topbar.language') }}</span>
                    <select v-model="language" @change="handleLocaleChange(language)">
                        <option value="en-US">🇺🇸 English</option>
                        <option value="zh-CN">🇨🇳 中文</option>
                    </select>
                </label>
                <label class="checkout-topbar__locale">
                    <span>{{ t('topbar.preview') }}</span>
                    <select v-model="activeState">
                        <option value="checkout">{{ localizedPreviewOptions.checkout }}</option>
                        <option value="success">{{ localizedPreviewOptions.success }}</option>
                        <option value="failed">{{ localizedPreviewOptions.failed }}</option>
                        <option value="processing">{{ localizedPreviewOptions.processing }}</option>
                        <option value="blocked">{{ localizedPreviewOptions.blocked }}</option>
                    </select>
                </label>
            </div>
        </header>

        <div class="checkout-trustbar">
            <div class="checkout-trustbar__item checkout-trustbar__item--secure">
                <strong>{{ t('trustbar.ssl') }}</strong>
                <span>{{ t('trustbar.sslDesc') }}</span>
            </div>
            <div class="checkout-trustbar__item checkout-trustbar__item--cards">
                <strong>{{ t('trustbar.cards') }}</strong>
                <span>{{ t('trustbar.cardsDesc') }}</span>
            </div>
            <div class="checkout-trustbar__item checkout-trustbar__item--merchant">
                <strong>{{ t('trustbar.merchant') }}</strong>
                <span>{{ t('trustbar.merchantDesc') }}</span>
            </div>
        </div>

        <section v-if="activeState === 'checkout'" class="checkout-layout">
            <aside class="checkout-sidebar">
                <div class="checkout-sidebar__merchant">
                    <img class="checkout-sidebar__merchant-logo" :src="checkoutBrand.logos.icon" :alt="checkoutBrand.name" />
                    <div>
                        <p class="checkout-sidebar__eyebrow">{{ t('checkout.merchantStore') }}</p>
                        <h1>Vexra Lifestyle Flagship</h1>
                        <span>{{ t('checkout.orderReference') }}</span>
                    </div>
                </div>

                <article class="checkout-summary-card">
                    <div class="checkout-summary-card__header">
                        <div>
                            <p>{{ t('checkout.orderSummary') }}</p>
                            <strong>USD 49.97</strong>
                        </div>
                        <span>{{ t('checkout.secure') }}</span>
                    </div>
                    <div class="checkout-order-list">
                        <article v-for="item in orderItems" :key="item.name" class="checkout-order-item">
                            <div class="checkout-order-item__thumb">{{ item.initial }}</div>
                            <div>
                                <strong>{{ item.name }}</strong>
                                <p>{{ item.meta }}</p>
                            </div>
                            <span>{{ item.amount }}</span>
                        </article>
                    </div>
                    <div class="checkout-summary-card__total">
                        <span>{{ t('checkout.total') }}</span>
                        <strong>USD 49.97</strong>
                    </div>
                </article>
            </aside>

            <section class="checkout-form-panel">
                <article class="checkout-section-card">
                    <div class="checkout-section-card__header">
                        <div>
                            <p>{{ t('checkout.contactInfo') }}</p>
                            <h2>{{ t('checkout.customerDetails') }}</h2>
                        </div>
                    </div>
                    <div class="checkout-fields">
                        <label class="checkout-field checkout-field--full">
                            <span>{{ t('checkout.email') }}</span>
                            <input placeholder="customer@example.com" />
                        </label>
                        <div class="checkout-field-grid">
                            <label class="checkout-field">
                                <span>{{ t('checkout.firstName') }}</span>
                                <input placeholder="Jessica" />
                            </label>
                            <label class="checkout-field">
                                <span>{{ t('checkout.lastName') }}</span>
                                <input placeholder="Miller" />
                            </label>
                        </div>
                        <div class="checkout-field-grid">
                            <label class="checkout-field">
                                <span>{{ t('checkout.country') }}</span>
                                <div class="checkout-country-select">
                                    <button
                                        class="checkout-country-select__button"
                                        type="button"
                                        :aria-expanded="countryDropdownOpen"
                                        :disabled="countryOptions.length === 0"
                                        @click="countryDropdownOpen = !countryDropdownOpen"
                                    >
                                        <span class="checkout-country-select__value">
                                            <span class="checkout-country-select__icon">
                                                <img
                                                    v-if="selectedCountry?.flagIconUrl"
                                                    :src="selectedCountry.flagIconUrl"
                                                    :alt="selectedCountry.countryCode"
                                                />
                                                <span v-else aria-hidden="true">{{ selectedCountryIcon }}</span>
                                            </span>
                                            <span>{{ selectedCountryLabel }}</span>
                                        </span>
                                        <span class="checkout-country-select__chevron" aria-hidden="true">⌄</span>
                                    </button>
                                    <div v-if="countryDropdownOpen && countryOptions.length > 0" class="checkout-country-select__menu">
                                        <button
                                            v-for="country in countryOptions"
                                            :key="country.countryCode"
                                            class="checkout-country-select__option"
                                            type="button"
                                            @click="handleCountryChange(country.countryCode)"
                                        >
                                            <span class="checkout-country-select__icon">
                                                <img
                                                    v-if="country.flagIconUrl"
                                                    :src="country.flagIconUrl"
                                                    :alt="country.countryCode"
                                                />
                                                <span v-else aria-hidden="true">🌐</span>
                                            </span>
                                            <span>{{ country.countryName }}</span>
                                        </button>
                                    </div>
                                </div>
                                <small v-if="countryLoadFailed" class="checkout-field__hint checkout-field__hint--full">
                                    {{ t('checkout.countryFallback') }}
                                </small>
                            </label>
                            <label class="checkout-field">
                                <span>{{ t('checkout.state') }}</span>
                                <select>
                                    <option>California</option>
                                    <option>Ontario</option>
                                    <option>New York</option>
                                </select>
                            </label>
                        </div>
                        <label class="checkout-field checkout-field--full">
                            <span>{{ t('checkout.address1') }}</span>
                            <input placeholder="123 Market Street" />
                        </label>
                        <label class="checkout-field checkout-field--full">
                            <span>{{ t('checkout.address2') }}</span>
                            <input placeholder="Apartment / Suite (optional)" />
                        </label>
                    </div>
                </article>

                <article class="checkout-section-card">
                    <div class="checkout-section-card__header">
                        <div>
                            <p>{{ t('checkout.paymentMethod') }}</p>
                            <h2>{{ t('checkout.chooseMethod') }}</h2>
                        </div>
                        <PaymentLogoGroup :keys="paymentHeaderLogoKeys" size="sm" align="end" />
                    </div>

                    <div class="checkout-payment-list">
                        <div
                            v-for="method in localizedPaymentMethods"
                            :key="method.id"
                            class="checkout-payment-item"
                        >
                            <button
                                :class="['checkout-payment-option', { 'is-active': selectedPaymentMethod === method.id }]"
                                type="button"
                                @click="selectedPaymentMethod = method.id"
                            >
                                <span class="checkout-payment-option__radio" aria-hidden="true"></span>
                                <span class="checkout-payment-option__body">
                                    <strong>{{ method.label }}</strong>
                                    <small>{{ method.description }}</small>
                                </span>
                                <PaymentLogoGroup
                                    v-if="method.logoKeys.length"
                                    class="checkout-payment-option__logos"
                                    :keys="method.logoKeys"
                                    size="sm"
                                    align="end"
                                />
                            </button>

                            <div
                                v-if="selectedPaymentMethod === method.id && method.id === 'card'"
                                class="checkout-payment-detail checkout-payment-detail--card"
                            >
                                <label class="checkout-field checkout-field--full">
                                    <span>{{ t('checkout.cardNumber') }}</span>
                                    <input inputmode="numeric" autocomplete="cc-number" placeholder="4111 1111 1111 1111" />
                                </label>
                                <div class="checkout-field-grid">
                                    <label class="checkout-field">
                                        <span>{{ t('checkout.expiry') }}</span>
                                        <input autocomplete="cc-exp" placeholder="09/29" />
                                    </label>
                                    <label class="checkout-field">
                                        <span>{{ t('checkout.cvc') }}</span>
                                        <input autocomplete="cc-csc" placeholder="123" />
                                    </label>
                                </div>
                                <div class="checkout-inline-note checkout-inline-note--error">
                                    {{ t('checkout.cardError') }}
                                </div>
                            </div>

                            <div
                                v-else-if="selectedPaymentMethod === method.id"
                                class="checkout-payment-detail checkout-payment-detail--method"
                            >
                                <article class="checkout-alt-methods__panel">
                                    <strong>{{ method.label }}</strong>
                                    <p>{{ method.helpText }}</p>
                                </article>
                            </div>
                        </div>
                    </div>
                </article>

                <button class="checkout-submit" type="button">{{ t('checkout.pay') }}</button>
            </section>
        </section>

        <section v-else :class="['checkout-status-shell', `checkout-status-shell--${activeState}`]">
            <article :class="['checkout-status-card', `checkout-status-card--${activeState}`]">
                <div v-if="activeState === 'blocked'" class="checkout-security-visual" aria-hidden="true">
                    <span class="checkout-security-visual__ring checkout-security-visual__ring--outer"></span>
                    <span class="checkout-security-visual__ring checkout-security-visual__ring--inner"></span>
                    <span class="checkout-security-visual__dot checkout-security-visual__dot--left"></span>
                    <span class="checkout-security-visual__dot checkout-security-visual__dot--right"></span>
                    <span class="checkout-security-visual__dot checkout-security-visual__dot--bottom"></span>
                    <span class="checkout-security-visual__shield">
                        <span class="checkout-security-visual__lock"></span>
                    </span>
                    <span class="checkout-security-visual__alert">!</span>
                </div>
                <div v-else-if="activeState === 'success'" class="checkout-success-visual" aria-hidden="true">
                    <span class="checkout-success-visual__halo"></span>
                    <span class="checkout-success-visual__ring"></span>
                    <span class="checkout-success-visual__check">✓</span>
                </div>
                <div v-else :class="['checkout-status-icon', `checkout-status-icon--${activeState}`]">
                    <span>{{ localizedStatusConfig.icon }}</span>
                </div>
                <p class="checkout-status-eyebrow">{{ localizedStatusConfig.eyebrow }}</p>
                <h1 :class="`checkout-status-title--${activeState}`">{{ localizedStatusConfig.title }}</h1>
                <p class="checkout-status-description">{{ localizedStatusConfig.description }}</p>

                <div v-if="activeState === 'success'" class="checkout-success-receipt">
                    <span>{{ t('status.successReceiptTitle') }}</span>
                    <strong>USD 49.97</strong>
                    <p>{{ t('status.successReceiptDesc') }}</p>
                </div>

                <div class="checkout-status-detail">
                    <div v-for="item in localizedStatusDetailRows" :key="item.label" class="checkout-status-detail__row">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>

                <div :class="['checkout-status-message', `checkout-status-message--${activeState}`]">
                    {{ localizedStatusConfig.message }}
                </div>

                <div v-if="activeState === 'failed'" class="checkout-failed-panel">
                    <strong>{{ t('status.failedHelpTitle') }}</strong>
                    <p>{{ t('status.failedHelpDesc') }}</p>
                </div>

                <div v-if="activeState === 'blocked'" class="checkout-blocked-panel">
                    <strong>{{ t('status.blockedReasonsTitle') }}</strong>
                    <ul>
                        <li v-for="reason in blockedReasons" :key="reason">{{ reason }}</li>
                    </ul>
                </div>

                <div v-if="activeState === 'processing'" class="checkout-processing-box">
                    <span>{{ t('status.estimatedCompletion') }}</span>
                    <strong>1 - 5 minutes</strong>
                    <p>{{ t('status.processingHint') }}</p>
                </div>

                <div class="checkout-status-actions">
                    <button class="checkout-status-button checkout-status-button--primary" type="button">
                        {{ localizedStatusConfig.primaryAction }}
                    </button>
                    <button class="checkout-status-button checkout-status-button--secondary" type="button">
                        {{ localizedStatusConfig.secondaryAction }}
                    </button>
                </div>
            </article>
        </section>

        <CheckoutTrustFooter />
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { PaymentLogoGroup, getSystemBrand, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { setLocale } from './i18n';
import { listCheckoutCountries, type CheckoutCountryConfig } from './api/checkoutConfig';
import CheckoutTrustFooter from './components/CheckoutTrustFooter.vue';

type CheckoutPreviewState = 'checkout' | 'success' | 'failed' | 'processing' | 'blocked';
type CheckoutLocale = 'en-US' | 'zh-CN';

const DEFAULT_LOCALE: CheckoutLocale = 'en-US';
const LOCALE_KEY = 'acquiring_checkout_locale';
const COUNTRY_KEY = 'acquiring_checkout_country';
const MANUAL_LOCALE_KEY = 'acquiring_checkout_locale_manual';
const LANGUAGE_OPTIONS: CheckoutLocale[] = ['en-US', 'zh-CN'];

const checkoutBrand = getSystemBrand('checkout');
const { t, locale } = useI18n();
const language = ref(locale.value);
const activeState = ref<CheckoutPreviewState>('checkout');
const selectedPaymentMethod = ref('card');
const countryOptions = ref<CheckoutCountryConfig[]>([]);
const selectedCountryCode = ref(readStoredValue(COUNTRY_KEY));
const countryDropdownOpen = ref(false);
const countryLoadFailed = ref(false);
const manualLanguageSelected = ref(readStoredValue(MANUAL_LOCALE_KEY) === 'true');

const orderItems = [
    { initial: 'C', name: 'Cloud Repair Serum', meta: 'USD 9.99 x 1', amount: 'USD 9.99' },
    { initial: 'S', name: 'Sea Salt Skincare Set', meta: 'USD 19.99 x 2', amount: 'USD 39.98' },
];

const paymentHeaderLogoKeys: PaymentLogoKey[] = [
    'visa',
    'mastercard',
    'jcb',
    'maestro',
    'americanExpress',
    'applePay',
    'googlePay',
];

const statusDetailRows = [
    { label: computed(() => t('status.amount')), value: 'USD 49.97' },
    { label: computed(() => t('status.merchantOrder')), value: 'Merchant 2026062100301' },
    { label: computed(() => t('status.paymentMethod')), value: 'Visa •••• 4242' },
    { label: computed(() => t('status.paymentId')), value: 'Wallet 2026062100301' },
    { label: computed(() => t('status.time')), value: '2026-06-21 19:32:16' },
];

const localizedPreviewOptions = computed(() => ({
    checkout: t('topbar.checkout'),
    success: t('topbar.success'),
    failed: t('topbar.failed'),
    processing: t('topbar.processing'),
    blocked: t('topbar.blocked'),
}));

const selectedCountry = computed(() => (
    countryOptions.value.find((country) => country.countryCode === selectedCountryCode.value)
    || countryOptions.value[0]
));

const selectedCountryIcon = computed(() => (
    selectedCountry.value?.flagIconUrl ? '' : '🌐'
));

const selectedCountryLabel = computed(() => (
    selectedCountry.value?.countryName || t('checkout.selectCountry')
));

const localizedPaymentMethods = computed(() => [
    {
        id: 'card',
        label: 'Bank Card',
        description: 'Visa / Mastercard / JCB / Maestro',
        helpText: 'Enter card details and billing address.',
        logoKeys: ['visa', 'mastercard', 'jcb', 'maestro'] as PaymentLogoKey[],
    },
    {
        id: 'paypal',
        label: 'PayPal',
        description: 'Redirect to PayPal wallet',
        helpText: 'The customer will be redirected to PayPal to approve the payment.',
        logoKeys: ['paypal'] as PaymentLogoKey[],
    },
    {
        id: 'spei',
        label: 'SPEI',
        description: 'Mexico local transfer',
        helpText: 'Show a virtual account or reference code for instant transfer.',
        logoKeys: [] as PaymentLogoKey[],
    },
    {
        id: 'wallet',
        label: 'Apple Pay',
        description: 'Fast wallet checkout',
        helpText: 'Use a saved wallet for faster authorization when available.',
        logoKeys: ['applePay', 'googlePay'] as PaymentLogoKey[],
    },
]);

const localizedStatusDetailRows = computed(() => {
    if (activeState.value === 'success') {
        return [
            { label: t('status.amount'), value: 'USD 49.97' },
            { label: t('status.merchantOrder'), value: 'Merchant 2026062100301' },
            { label: t('status.paymentMethod'), value: 'Visa •••• 4242' },
            { label: t('status.authorizationCode'), value: 'VX-AP-829104' },
            { label: t('status.time'), value: '2026-06-21 19:32:16' },
        ];
    }
    if (activeState.value === 'failed') {
        return [
            { label: t('status.amount'), value: 'USD 49.97' },
            { label: t('status.merchantOrder'), value: 'Merchant 2026062100301' },
            { label: t('status.paymentMethod'), value: 'Visa •••• 4242' },
            { label: t('status.failureReason'), value: t('status.failureReasonValue') },
            { label: t('status.paymentId'), value: 'Wallet 2026062100301' },
        ];
    }
    if (activeState.value === 'blocked') {
        return [
            { label: t('status.referenceCode'), value: 'SP-S001' },
            { label: t('status.requestId'), value: 'REQ 2026062100301' },
            { label: t('status.merchantOrder'), value: 'Merchant 2026062100301' },
            { label: t('status.securityPolicy'), value: t('status.securityPolicyValue') },
            { label: t('status.time'), value: '2026-06-21 19:32:16' },
        ];
    }
    return statusDetailRows.map((item) => ({
        label: item.label.value,
        value: item.value,
    }));
});

const blockedReasons = computed(() => [
    t('status.blockedReasonInvalidRequest'),
    t('status.blockedReasonSignature'),
    t('status.blockedReasonOrigin'),
]);

const localizedStatusConfig = computed(() => {
    if (activeState.value === 'success') {
        return {
            icon: '✓',
            eyebrow: t('status.successEyebrow'),
            title: t('status.successTitle'),
            description: t('status.successDescription'),
            message: t('status.successMessage'),
            primaryAction: t('status.successPrimary'),
            secondaryAction: t('status.successSecondary'),
        };
    }
    if (activeState.value === 'failed') {
        return {
            icon: '×',
            eyebrow: t('status.failedEyebrow'),
            title: t('status.failedTitle'),
            description: t('status.failedDescription'),
            message: t('status.failedMessage'),
            primaryAction: t('status.failedPrimary'),
            secondaryAction: t('status.failedSecondary'),
        };
    }
    if (activeState.value === 'blocked') {
        return {
            icon: '!',
            eyebrow: t('status.blockedEyebrow'),
            title: t('status.blockedTitle'),
            description: t('status.blockedDescription'),
            message: t('status.blockedMessage'),
            primaryAction: t('status.blockedPrimary'),
            secondaryAction: t('status.blockedSecondary'),
        };
    }
    return {
        icon: '◔',
        eyebrow: t('status.processingEyebrow'),
        title: t('status.processingTitle'),
        description: t('status.processingDescription'),
        message: t('status.processingMessage'),
        primaryAction: t('status.processingPrimary'),
        secondaryAction: t('status.processingSecondary'),
    };
});

function handleLocaleChange(value: string) {
    applyLocale(normalizeLocale(value), true);
}

function handleCountryChange(countryCode: string) {
    selectedCountryCode.value = countryCode;
    countryDropdownOpen.value = false;
    writeStoredValue(COUNTRY_KEY, countryCode);
}

function applyLocale(value: CheckoutLocale, manual: boolean) {
    setLocale(value);
    language.value = value;
    if (manual) {
        manualLanguageSelected.value = true;
        writeStoredValue(MANUAL_LOCALE_KEY, 'true');
    }
}

function normalizeLocale(value?: string | null): CheckoutLocale {
    return LANGUAGE_OPTIONS.includes(value as CheckoutLocale) ? value as CheckoutLocale : DEFAULT_LOCALE;
}

function resolveInitialLocale(): CheckoutLocale {
    const urlLocale = new URLSearchParams(window.location.search).get('lang');
    if (urlLocale) {
        manualLanguageSelected.value = true;
        writeStoredValue(MANUAL_LOCALE_KEY, 'true');
        return normalizeLocale(urlLocale);
    }
    if (manualLanguageSelected.value) {
        return normalizeLocale(readStoredValue(LOCALE_KEY));
    }
    const storedLocale = normalizeLocale(readStoredValue(LOCALE_KEY));
    if (readStoredValue(LOCALE_KEY)) {
        return storedLocale;
    }
    const browserLocale = navigator.languages?.find((item) => item.startsWith('zh') || item.startsWith('en'))
        || navigator.language;
    return browserLocale?.startsWith('zh') ? 'zh-CN' : DEFAULT_LOCALE;
}

function readStoredValue(key: string): string {
    try {
        return localStorage.getItem(key) || '';
    } catch {
        return '';
    }
}

function writeStoredValue(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // localStorage may be unavailable
    }
}

async function loadCountries() {
    try {
        const countries = await listCheckoutCountries();
        countryOptions.value = countries;
    } catch {
        countryLoadFailed.value = true;
    }
    if (!countryOptions.value.some((country) => country.countryCode === selectedCountryCode.value)) {
        selectedCountryCode.value = countryOptions.value[0]?.countryCode || '';
        if (selectedCountryCode.value) {
            writeStoredValue(COUNTRY_KEY, selectedCountryCode.value);
        }
    }
}

applyLocale(resolveInitialLocale(), false);

onMounted(() => {
    loadCountries();
});

</script>
