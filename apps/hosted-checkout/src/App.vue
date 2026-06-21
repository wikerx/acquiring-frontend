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
                        <option value="en-US">English</option>
                        <option value="zh-CN">中文</option>
                    </select>
                </label>
                <label class="checkout-topbar__locale">
                    <span>{{ t('topbar.preview') }}</span>
                    <select v-model="activeState">
                        <option value="checkout">{{ localizedPreviewOptions.checkout }}</option>
                        <option value="success">{{ localizedPreviewOptions.success }}</option>
                        <option value="failed">{{ localizedPreviewOptions.failed }}</option>
                        <option value="processing">{{ localizedPreviewOptions.processing }}</option>
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
                                <select>
                                    <option>United States</option>
                                    <option>Canada</option>
                                    <option>Singapore</option>
                                </select>
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
                        <div class="checkout-payment-icons">
                            <span
                                v-for="brand in paymentBrandLogos"
                                :key="brand.id"
                                :class="['checkout-payment-logo', `checkout-payment-logo--${brand.id}`]"
                            >
                                {{ brand.shortLabel }}
                            </span>
                        </div>
                    </div>

                    <div class="checkout-payment-tabs">
                        <button
                            v-for="method in localizedPaymentMethods"
                            :key="method.id"
                            :class="['checkout-payment-tab', { 'is-active': selectedPaymentMethod === method.id }]"
                            type="button"
                            @click="selectedPaymentMethod = method.id"
                        >
                            <strong>{{ method.label }}</strong>
                            <span>{{ method.description }}</span>
                        </button>
                    </div>

                    <div v-if="selectedPaymentMethod === 'card'" class="checkout-fields">
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

                    <div v-else class="checkout-alt-methods">
                        <article class="checkout-alt-methods__panel">
                            <strong>{{ activeMethod?.label }}</strong>
                            <p>{{ activeMethod?.helpText }}</p>
                        </article>
                    </div>
                </article>

                <button class="checkout-submit" type="button">{{ t('checkout.pay') }}</button>
            </section>
        </section>

        <section v-else class="checkout-status-shell">
            <article class="checkout-status-card">
                <div v-if="activeState === 'failed'" class="checkout-security-visual" aria-hidden="true">
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
                <div v-else :class="['checkout-status-icon', `checkout-status-icon--${activeState}`]">
                    <span>{{ localizedStatusConfig.icon }}</span>
                </div>
                <h1 :class="`checkout-status-title--${activeState}`">{{ localizedStatusConfig.title }}</h1>
                <p class="checkout-status-description">{{ localizedStatusConfig.description }}</p>

                <div class="checkout-status-detail">
                    <div v-for="item in localizedStatusDetailRows" :key="item.label" class="checkout-status-detail__row">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>

                <div :class="['checkout-status-message', `checkout-status-message--${activeState}`]">
                    {{ localizedStatusConfig.message }}
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
import { computed, ref } from 'vue';
import { getSystemBrand } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { setLocale } from './i18n';
import CheckoutTrustFooter from './components/CheckoutTrustFooter.vue';

type CheckoutPreviewState = 'checkout' | 'success' | 'failed' | 'processing';

const checkoutBrand = getSystemBrand('checkout');
const { t, locale } = useI18n();
const language = ref(locale.value);
const activeState = ref<CheckoutPreviewState>('checkout');
const selectedPaymentMethod = ref('card');

const orderItems = [
    { initial: 'C', name: 'Cloud Repair Serum', meta: 'USD 9.99 x 1', amount: 'USD 9.99' },
    { initial: 'S', name: 'Sea Salt Skincare Set', meta: 'USD 19.99 x 2', amount: 'USD 39.98' },
];

const paymentBrandLogos = computed(() => [
    { id: 'visa', shortLabel: 'VISA' },
    { id: 'mastercard', shortLabel: 'MC' },
    { id: 'diners', shortLabel: 'DC' },
    { id: 'apple', shortLabel: 'Apple Pay' },
    { id: 'google', shortLabel: 'G Pay' },
]);

const paymentMethods = [
    { id: 'card', label: 'Bank Card', description: 'Visa / Mastercard / JCB', helpText: 'Enter card details and billing address.' },
    { id: 'paypal', label: 'PayPal', description: 'Redirect to PayPal wallet', helpText: 'The customer will be redirected to PayPal to approve the payment.' },
    { id: 'spei', label: 'SPEI', description: 'Mexico local transfer', helpText: 'Show a virtual account or reference code for instant transfer.' },
    { id: 'wallet', label: 'Digital Wallet', description: 'WeChat / local wallets', helpText: 'Render QR or deep link flow according to the selected wallet.' },
];

const activeMethod = computed(() =>
    paymentMethods.find((item) => item.id === selectedPaymentMethod.value),
);

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
}));

const localizedPaymentMethods = computed(() => [
    { id: 'card', label: 'Bank Card', description: 'Visa / Mastercard / JCB', helpText: 'Enter card details and billing address.' },
    { id: 'paypal', label: 'PayPal', description: 'Redirect to PayPal wallet', helpText: 'The customer will be redirected to PayPal to approve the payment.' },
    { id: 'spei', label: 'SPEI', description: 'Mexico local transfer', helpText: 'Show a virtual account or reference code for instant transfer.' },
    { id: 'wallet', label: 'Digital Wallet', description: 'WeChat / local wallets', helpText: 'Render QR or deep link flow according to the selected wallet.' },
]);

const localizedStatusDetailRows = computed(() =>
    statusDetailRows.map((item) => ({
        label: item.label.value,
        value: item.value,
    })),
);

const localizedStatusConfig = computed(() => {
    if (activeState.value === 'success') {
        return {
            icon: '✓',
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
            title: t('status.failedTitle'),
            description: t('status.failedDescription'),
            message: t('status.failedMessage'),
            primaryAction: t('status.failedPrimary'),
            secondaryAction: t('status.failedSecondary'),
        };
    }
    return {
        icon: '◔',
        title: t('status.processingTitle'),
        description: t('status.processingDescription'),
        message: t('status.processingMessage'),
        primaryAction: t('status.processingPrimary'),
        secondaryAction: t('status.processingSecondary'),
    };
});

function handleLocaleChange(value: string) {
    setLocale(value as 'zh-CN' | 'en-US');
    language.value = value;
}
</script>
