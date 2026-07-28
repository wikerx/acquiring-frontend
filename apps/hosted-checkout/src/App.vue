<template>
    <main class="checkout-shell">
        <header class="checkout-topbar">
            <div class="checkout-topbar__brand">
                <img class="checkout-topbar__logo" :src="checkoutBrand.logos.horizontal" :alt="checkoutBrand.name" />
                <span>{{ checkoutBrand.subtitleEn }}</span>
            </div>
            <div class="checkout-topbar__meta">
                <span v-if="session?.checkoutSessionId" class="checkout-topbar__status">
                    {{ statusChipText }}
                </span>
                <label class="checkout-topbar__locale">
                    <span class="checkout-topbar__locale-control">
                        <img
                            class="checkout-topbar__locale-flag"
                            :src="activeLocaleFlag.src"
                            :alt="activeLocaleFlag.alt"
                        />
                        <select
                            v-model="language"
                            :aria-label="t('topbar.language')"
                            @change="handleLocaleChange(language)"
                        >
                            <option value="en-US">English</option>
                            <option value="zh-CN">中文</option>
                        </select>
                    </span>
                </label>
            </div>
        </header>

        <div class="checkout-trustbar">
            <div class="checkout-trustbar__item checkout-trustbar__item--secure">
                <img class="checkout-trustbar__logo" :src="checkoutBrand.logos.icon" :alt="checkoutBrand.name" />
                <strong>{{ t('trustbar.ssl') }}</strong>
                <span>{{ t('trustbar.sslDesc') }}</span>
            </div>
            <div class="checkout-trustbar__item checkout-trustbar__item--cards" :aria-label="t('trustbar.cards')">
                <PaymentLogoGroup :keys="trustbarLogoKeys" size="sm" align="start" />
            </div>
            <div v-if="session?.merchant?.displayName" class="checkout-trustbar__item checkout-trustbar__item--merchant">
                <strong>{{ t('trustbar.merchant') }}</strong>
                <span>{{ merchantName }}</span>
            </div>
        </div>

        <section v-if="runtimeState === 'loading'" class="checkout-status-shell">
            <article class="checkout-status-card">
                <div class="checkout-status-icon checkout-status-icon--processing">
                    <span>...</span>
                </div>
                <p class="checkout-status-eyebrow">{{ t('status.processingEyebrow') }}</p>
                <h1 class="checkout-status-title--processing">{{ t('checkout.loadingTitle') }}</h1>
                <p class="checkout-status-description">{{ t('checkout.loadingDescription') }}</p>
            </article>
        </section>

        <section v-else-if="runtimeState === 'checkout'" class="checkout-layout">
            <aside class="checkout-sidebar">
                <div class="checkout-sidebar__merchant">
                    <img
                        class="checkout-sidebar__merchant-logo"
                        :src="session?.merchant?.logoUrl || checkoutBrand.logos.icon"
                        :alt="merchantName"
                    />
                    <div>
                        <p class="checkout-sidebar__eyebrow">{{ t('checkout.merchantStore') }}</p>
                        <h1>{{ merchantName }}</h1>
                        <span>{{ orderReferenceText }}</span>
                    </div>
                </div>

                <article class="checkout-summary-card">
                    <div class="checkout-summary-card__header">
                        <div>
                            <p>{{ t('checkout.orderSummary') }}</p>
                            <strong>{{ formattedAmount }}</strong>
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
                        <strong>{{ formattedAmount }}</strong>
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
                            <input
                                v-model.trim="billingForm.email"
                                autocomplete="email"
                                placeholder="customer@example.com"
                                :aria-invalid="Boolean(fieldErrors.email)"
                            />
                            <small v-if="fieldErrors.email" class="checkout-field__hint checkout-field__hint--error">
                                {{ fieldErrors.email }}
                            </small>
                        </label>
                        <div class="checkout-field-grid">
                            <label class="checkout-field">
                                <span>{{ t('checkout.firstName') }}</span>
                                <input
                                    v-model.trim="billingForm.firstName"
                                    autocomplete="given-name"
                                    placeholder="Jessica"
                                    :aria-invalid="Boolean(fieldErrors.firstName)"
                                />
                                <small v-if="fieldErrors.firstName" class="checkout-field__hint checkout-field__hint--error">
                                    {{ fieldErrors.firstName }}
                                </small>
                            </label>
                            <label class="checkout-field">
                                <span>{{ t('checkout.lastName') }}</span>
                                <input
                                    v-model.trim="billingForm.lastName"
                                    autocomplete="family-name"
                                    placeholder="Miller"
                                    :aria-invalid="Boolean(fieldErrors.lastName)"
                                />
                                <small v-if="fieldErrors.lastName" class="checkout-field__hint checkout-field__hint--error">
                                    {{ fieldErrors.lastName }}
                                </small>
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
                                                <span v-else aria-hidden="true">GL</span>
                                            </span>
                                            <span>{{ country.countryName }}</span>
                                        </button>
                                    </div>
                                </div>
                                <small v-if="countryLoadFailed" class="checkout-field__hint checkout-field__hint--full">
                                    {{ t('checkout.countryFallback') }}
                                </small>
                                <small v-if="fieldErrors.country" class="checkout-field__hint checkout-field__hint--error">
                                    {{ fieldErrors.country }}
                                </small>
                            </label>
                            <label class="checkout-field">
                                <span>{{ t('checkout.state') }}</span>
                                <input v-model.trim="billingForm.state" autocomplete="address-level1" placeholder="California" />
                            </label>
                        </div>
                        <div class="checkout-field-grid">
                            <label class="checkout-field">
                                <span>{{ t('checkout.city') }}</span>
                                <input v-model.trim="billingForm.city" autocomplete="address-level2" placeholder="San Francisco" />
                            </label>
                            <label class="checkout-field">
                                <span>{{ t('checkout.postal') }}</span>
                                <input v-model.trim="billingForm.postal" autocomplete="postal-code" placeholder="94105" />
                            </label>
                        </div>
                        <label class="checkout-field checkout-field--full">
                            <span>{{ t('checkout.address1') }}</span>
                            <input v-model.trim="billingForm.street" autocomplete="address-line1" placeholder="123 Market Street" />
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

                    <div v-if="supportedPaymentMethods.length === 0" class="checkout-inline-note checkout-inline-note--error">
                        {{ t('checkout.noPaymentMethods') }}
                    </div>

                    <div class="checkout-payment-list">
                        <div
                            v-for="method in supportedPaymentMethods"
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
                                v-if="selectedPaymentMethod === method.id && method.paymentMethod === 'BANK_CARD'"
                                class="checkout-payment-detail checkout-payment-detail--card"
                            >
                                <label class="checkout-field checkout-field--full">
                                    <span>{{ t('checkout.cardholderName') }}</span>
                                    <input
                                        v-model.trim="cardForm.cardholderName"
                                        autocomplete="cc-name"
                                        placeholder="Jessica Miller"
                                        :aria-invalid="Boolean(fieldErrors.cardholderName)"
                                    />
                                    <small v-if="fieldErrors.cardholderName" class="checkout-field__hint checkout-field__hint--error">
                                        {{ fieldErrors.cardholderName }}
                                    </small>
                                </label>
                                <label class="checkout-field checkout-field--full">
                                    <span>{{ t('checkout.cardNumber') }}</span>
                                    <input
                                        v-model="cardForm.cardNumber"
                                        inputmode="numeric"
                                        autocomplete="cc-number"
                                        placeholder="4111 1111 1111 1111"
                                        :aria-invalid="Boolean(fieldErrors.cardNumber)"
                                        @input="formatCardNumber"
                                    />
                                    <small v-if="fieldErrors.cardNumber" class="checkout-field__hint checkout-field__hint--error">
                                        {{ fieldErrors.cardNumber }}
                                    </small>
                                </label>
                                <div class="checkout-field-grid">
                                    <label class="checkout-field">
                                        <span>{{ t('checkout.expiry') }}</span>
                                        <input
                                            v-model="cardForm.expiry"
                                            autocomplete="cc-exp"
                                            placeholder="09/29"
                                            :aria-invalid="Boolean(fieldErrors.expiry)"
                                            @input="formatExpiry"
                                        />
                                        <small v-if="fieldErrors.expiry" class="checkout-field__hint checkout-field__hint--error">
                                            {{ fieldErrors.expiry }}
                                        </small>
                                    </label>
                                    <label class="checkout-field">
                                        <span>{{ t('checkout.cvc') }}</span>
                                        <input
                                            v-model="cardForm.cvc"
                                            inputmode="numeric"
                                            autocomplete="cc-csc"
                                            placeholder="123"
                                            :aria-invalid="Boolean(fieldErrors.cvc)"
                                            @input="formatCvc"
                                        />
                                        <small v-if="fieldErrors.cvc" class="checkout-field__hint checkout-field__hint--error">
                                            {{ fieldErrors.cvc }}
                                        </small>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>

                <div v-if="formMessage" class="checkout-inline-note checkout-inline-note--error">
                    {{ formMessage }}
                </div>
                <button
                    class="checkout-submit"
                    type="button"
                    :disabled="submitting || supportedPaymentMethods.length === 0"
                    @click="handleSubmitPayment"
                >
                    {{ submitting ? t('checkout.submitting') : payButtonText }}
                </button>
            </section>
        </section>

        <section v-else-if="runtimeState === 'threeDs'" class="checkout-status-shell">
            <article class="checkout-status-card checkout-status-card--processing">
                <div class="checkout-status-icon checkout-status-icon--processing">
                    <span>3D</span>
                </div>
                <p class="checkout-status-eyebrow">{{ t('status.processingEyebrow') }}</p>
                <h1 class="checkout-status-title--processing">{{ t('checkout.threeDsTitle') }}</h1>
                <p class="checkout-status-description">{{ t('checkout.threeDsDescription') }}</p>
                <iframe
                    v-if="threeDsHtml"
                    class="checkout-three-ds-frame"
                    :srcdoc="threeDsHtml"
                    sandbox="allow-forms allow-scripts"
                    title="3DS authentication"
                ></iframe>
                <div v-else class="checkout-processing-box">
                    <span>{{ t('checkout.threeDsRedirectLabel') }}</span>
                    <strong>{{ t('checkout.threeDsRedirectTitle') }}</strong>
                    <p>{{ t('checkout.threeDsRedirectDescription') }}</p>
                </div>
                <div class="checkout-status-actions">
                    <button class="checkout-status-button checkout-status-button--primary" type="button" @click="refreshPaymentStatus">
                        {{ t('status.processingPrimary') }}
                    </button>
                    <button class="checkout-status-button checkout-status-button--secondary" type="button" @click="goToCancelUrl">
                        {{ t('status.processingSecondary') }}
                    </button>
                </div>
            </article>
        </section>

        <section v-else :class="['checkout-status-shell', `checkout-status-shell--${statusViewState}`]">
            <article :class="['checkout-status-card', `checkout-status-card--${statusViewState}`]">
                <div v-if="statusViewState === 'blocked'" class="checkout-security-visual" aria-hidden="true">
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
                <div v-else-if="statusViewState === 'success'" class="checkout-success-visual" aria-hidden="true">
                    <span class="checkout-success-visual__halo"></span>
                    <span class="checkout-success-visual__ring"></span>
                    <span class="checkout-success-visual__check">✓</span>
                </div>
                <div v-else :class="['checkout-status-icon', `checkout-status-icon--${statusViewState}`]">
                    <span>{{ localizedStatusConfig.icon }}</span>
                </div>
                <p class="checkout-status-eyebrow">{{ localizedStatusConfig.eyebrow }}</p>
                <h1 :class="`checkout-status-title--${statusViewState}`">{{ localizedStatusConfig.title }}</h1>
                <p class="checkout-status-description">{{ localizedStatusConfig.description }}</p>

                <div v-if="statusViewState === 'success'" class="checkout-success-receipt">
                    <span>{{ t('status.successReceiptTitle') }}</span>
                    <strong>{{ formattedResultAmount }}</strong>
                    <p>{{ t('status.successReceiptDesc') }}</p>
                </div>

                <div class="checkout-status-detail">
                    <div v-for="item in localizedStatusDetailRows" :key="item.label" class="checkout-status-detail__row">
                        <span>{{ item.label }}</span>
                        <PaymentLogoGroup
                            v-if="item.type === 'paymentLogo'"
                            class="checkout-status-detail__payment-logo"
                            :keys="item.logoKeys"
                            size="sm"
                            align="end"
                        />
                        <strong v-else>{{ item.value }}</strong>
                    </div>
                </div>

                <div :class="['checkout-status-message', `checkout-status-message--${statusViewState}`]">
                    {{ localizedStatusConfig.message }}
                </div>

                <div v-if="statusViewState === 'failed'" class="checkout-failed-panel">
                    <strong>{{ t('status.failedHelpTitle') }}</strong>
                    <p>{{ failureHelpText }}</p>
                </div>

                <div v-if="statusViewState === 'blocked'" class="checkout-blocked-panel">
                    <strong>{{ t('status.blockedReasonsTitle') }}</strong>
                    <ul>
                        <li v-for="reason in blockedReasons" :key="reason">{{ reason }}</li>
                    </ul>
                </div>

                <div v-if="statusViewState === 'processing'" class="checkout-processing-box">
                    <span>{{ t('status.estimatedCompletion') }}</span>
                    <strong>{{ t('status.processingEstimate') }}</strong>
                    <p>{{ t('status.processingHint') }}</p>
                </div>

                <div class="checkout-status-actions">
                    <button
                        v-if="statusViewState === 'failed' && retryAvailable"
                        class="checkout-status-button checkout-status-button--primary"
                        type="button"
                        @click="retryPayment"
                    >
                        {{ t('status.failedPrimary') }}
                    </button>
                    <button
                        v-else-if="statusViewState === 'processing'"
                        class="checkout-status-button checkout-status-button--primary"
                        type="button"
                        @click="refreshPaymentStatus"
                    >
                        {{ t('status.processingPrimary') }}
                    </button>
                    <button
                        v-else
                        class="checkout-status-button checkout-status-button--primary"
                        type="button"
                        @click="goToReturnUrl"
                    >
                        {{ localizedStatusConfig.primaryAction }}
                    </button>
                    <button class="checkout-status-button checkout-status-button--secondary" type="button" @click="goToCancelUrl">
                        {{ localizedStatusConfig.secondaryAction }}
                    </button>
                </div>
            </article>
        </section>

        <CheckoutTrustFooter />
    </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { PaymentLogoGroup, getSystemBrand, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { setLocale } from './i18n';
import { listCheckoutCountries, type CheckoutCountryConfig } from './api/checkoutConfig';
import {
    queryCheckoutPaymentStatus,
    queryCheckoutSession,
    returnCheckoutThreeDs,
    submitCheckoutPayment,
    type CheckoutPageState,
    type HostedCheckoutClientContext,
    type HostedCheckoutPaymentMethod,
    type HostedCheckoutPaymentResult,
    type HostedCheckoutSession,
} from './api/hostedCheckout';
import CheckoutTrustFooter from './components/CheckoutTrustFooter.vue';

type CheckoutRuntimeState = 'loading' | 'checkout' | 'threeDs' | 'success' | 'failed' | 'processing' | 'blocked';
type CheckoutStatusViewState = 'success' | 'failed' | 'processing' | 'blocked';
type CheckoutLocale = 'en-US' | 'zh-CN';

interface PaymentOption {
    id: string;
    paymentMethod: string;
    channelCode?: string;
    label: string;
    description: string;
    logoKeys: PaymentLogoKey[];
    threeDsMode?: string;
}

interface FieldErrors {
    email?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    cardholderName?: string;
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
}

interface ThreeDsReturnMessage {
    type?: string;
    checkoutSessionId?: string;
    checkoutAttemptId?: string;
    threeDsReturnToken?: string;
    authenticationData?: unknown;
}

const DEFAULT_LOCALE: CheckoutLocale = 'en-US';
const LOCALE_KEY = 'acquiring_checkout_locale';
const COUNTRY_KEY = 'acquiring_checkout_country';
const MANUAL_LOCALE_KEY = 'acquiring_checkout_locale_manual';
const DEVICE_ID_KEY = 'acquiring_checkout_device_id';
const LANGUAGE_OPTIONS: CheckoutLocale[] = ['en-US', 'zh-CN'];
const LANGUAGE_FLAG_ASSETS: Record<CheckoutLocale, { src: string; alt: string }> = {
    'en-US': {
        src: new URL('./assets/flags/us.svg', import.meta.url).href,
        alt: 'English',
    },
    'zh-CN': {
        src: new URL('./assets/flags/cn.svg', import.meta.url).href,
        alt: '中文',
    },
};
const COUNTRY_FLAG_ASSETS: Record<string, string> = {
    USA: new URL('./assets/flags/us.svg', import.meta.url).href,
    CHN: new URL('./assets/flags/cn.svg', import.meta.url).href,
};
const POLLING_MAX_ATTEMPTS = 30;
const CARD_BRAND_LOGOS: Record<string, PaymentLogoKey> = {
    VISA: 'visa',
    MASTERCARD: 'mastercard',
    MC: 'mastercard',
    JCB: 'jcb',
    MAESTRO: 'maestro',
    AMEX: 'americanExpress',
    AMERICAN_EXPRESS: 'americanExpress',
    DISCOVER: 'discover',
    DINERS: 'dinersClub',
    UNIONPAY: 'unionPay',
};
const SYSTEM_PAYMENT_LOGOS: PaymentLogoKey[] = [
    'visa',
    'mastercard',
    'jcb',
    'maestro',
    'americanExpress',
    'discover',
    'unionPay',
    'dinersClub',
    'applePay',
    'googlePay',
    'paypal',
];

const checkoutBrand = getSystemBrand('checkout');
const { t, locale } = useI18n();
const language = ref(locale.value);
const activeLocaleFlag = computed(() => LANGUAGE_FLAG_ASSETS[normalizeLocale(language.value)]);
const runtimeState = ref<CheckoutRuntimeState>('loading');
const statusViewState = computed<CheckoutStatusViewState>(() => {
    if (runtimeState.value === 'success') {
        return 'success';
    }
    if (runtimeState.value === 'failed') {
        return 'failed';
    }
    if (runtimeState.value === 'blocked') {
        return 'blocked';
    }
    return 'processing';
});
const session = ref<HostedCheckoutSession | null>(null);
const paymentResult = ref<HostedCheckoutPaymentResult | null>(null);
const selectedPaymentMethod = ref('');
const countryOptions = ref<CheckoutCountryConfig[]>([]);
const selectedCountryCode = ref(readStoredValue(COUNTRY_KEY));
const countryDropdownOpen = ref(false);
const countryLoadFailed = ref(false);
const manualLanguageSelected = ref(readStoredValue(MANUAL_LOCALE_KEY) === 'true');
const submitting = ref(false);
const formMessage = ref('');
const fieldErrors = reactive<FieldErrors>({});
const pollTimer = ref<number | null>(null);
const pollAttempts = ref(0);
const devStatusPolls = ref(0);
const initError = ref('');
const threeDsReturnHandling = ref(false);

const billingForm = reactive({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    state: '',
    city: '',
    street: '',
    postal: '',
});

const cardForm = reactive({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
});

const routeToken = computed(() => parseCheckoutRoute().opaqueToken);
const routeCover = computed(() => parseCheckoutRoute().cover);

const merchantName = computed(() => session.value?.merchant?.displayName || checkoutBrand.name);
const order = computed(() => session.value?.order);
const checkoutInfo = computed(() => session.value?.checkout);
const latestPageState = computed(() => paymentResult.value?.pageState || session.value?.pageState || '');
const statusChipText = computed(() => readablePageState(latestPageState.value));
const orderReferenceText = computed(() => (
    order.value?.orderNo
        ? t('checkout.orderReferenceDynamic', { orderNo: order.value.orderNo })
        : t('checkout.orderReferencePending')
));
const formattedAmount = computed(() => formatMoney(order.value?.amount, order.value?.currency));
const formattedResultAmount = computed(() => (
    paymentResult.value?.result
        ? formatMoney(paymentResult.value.result.amount, paymentResult.value.result.currency)
        : formattedAmount.value
));
const payButtonText = computed(() => t('checkout.payAmount', { amount: formattedAmount.value }));
const retryAvailable = computed(() => (
    paymentResult.value?.failure?.retryAllowed
    ?? checkoutInfo.value?.retryAllowed
    ?? false
));
const failureHelpText = computed(() => paymentResult.value?.failure?.message || t('status.failedHelpDesc'));
const threeDsHtml = computed(() => paymentResult.value?.threeDsAction?.actionType === 'HTML'
    ? paymentResult.value?.threeDsAction?.html || ''
    : '');

const paymentHeaderLogoKeys = computed<PaymentLogoKey[]>(() => {
    const logos = supportedPaymentMethods.value.flatMap((method) => method.logoKeys);
    return uniqueLogos(logos.length ? logos : ['visa', 'mastercard', 'jcb', 'maestro']);
});
const trustbarLogoKeys = computed<PaymentLogoKey[]>(() => SYSTEM_PAYMENT_LOGOS);

const selectedCountry = computed(() => (
    countryOptions.value.find((country) => country.countryCode === selectedCountryCode.value)
    || countryOptions.value[0]
));

const selectedCountryIcon = computed(() => (
    selectedCountry.value?.flagIconUrl ? '' : 'GL'
));

const selectedCountryLabel = computed(() => (
    selectedCountry.value?.countryName || t('checkout.selectCountry')
));

const supportedPaymentMethods = computed<PaymentOption[]>(() => {
    const methods = session.value?.paymentMethods || [];
    return methods
        .filter((method) => normalizeCode(method.paymentMethod) === 'BANK_CARD')
        .map((method) => toPaymentOption(method));
});

const orderItems = computed(() => {
    const parsedItems = parseOrderItems(order.value?.itemsJson);
    if (parsedItems.length > 0) {
        return parsedItems.map((item, index) => ({
            initial: item.name?.slice(0, 1).toUpperCase() || String(index + 1),
            name: item.name || t('checkout.orderItemFallback', { index: index + 1 }),
            meta: [
                item.currency || order.value?.currency,
                item.amount,
                item.quantity ? `x ${item.quantity}` : '',
            ].filter(Boolean).join(' '),
            amount: formatMoney(item.amount, item.currency || order.value?.currency),
        }));
    }
    return [{
        initial: (order.value?.subject || 'O').slice(0, 1).toUpperCase(),
        name: order.value?.subject || t('checkout.orderItemDefault'),
        meta: order.value?.description || t('checkout.orderItemDescriptionFallback'),
        amount: formattedAmount.value,
    }];
});

const localizedStatusDetailRows = computed(() => {
    const result = paymentResult.value?.result;
    const rows = [
        { label: t('status.amount'), value: formattedResultAmount.value },
        { label: t('status.merchantOrder'), value: result?.merchantOrderNo || order.value?.orderNo || '-' },
        { label: t('status.paymentMethod'), value: '', type: 'paymentLogo', logoKeys: statusPaymentLogoKeys.value },
    ];
    if (statusViewState.value === 'success') {
        rows.push(
            { label: t('status.authorizationCode'), value: result?.authCode || '-' },
            { label: t('status.paymentId'), value: result?.transactionId || paymentResult.value?.checkoutAttemptId || '-' },
            { label: t('status.time'), value: formatDateTime(result?.transactionDateTime) },
        );
        return rows;
    }
    if (statusViewState.value === 'failed') {
        rows.push(
            { label: t('status.failureReason'), value: paymentResult.value?.failure?.reasonCode || t('status.failureReasonValue') },
            { label: t('status.remainingAttempts'), value: String(paymentResult.value?.failure?.remainingAttemptCount ?? '-') },
        );
        return rows;
    }
    if (statusViewState.value === 'blocked') {
        return [
            { label: t('status.referenceCode'), value: paymentResult.value?.failure?.reasonCode || 'SP-S001' },
            { label: t('status.requestId'), value: session.value?.checkoutSessionId || '-' },
            { label: t('status.merchantOrder'), value: order.value?.orderNo || '-' },
            { label: t('status.securityPolicy'), value: t('status.securityPolicyValue') },
        ];
    }
    rows.push(
        { label: t('status.paymentId'), value: paymentResult.value?.checkoutAttemptId || '-' },
        { label: t('status.pollingInterval'), value: t('status.pollingIntervalValue', { seconds: pollingIntervalSeconds.value }) },
    );
    return rows;
});

const blockedReasons = computed(() => [
    initError.value || t('status.blockedReasonInvalidRequest'),
    t('status.blockedReasonSignature'),
    t('status.blockedReasonOrigin'),
]);

const localizedStatusConfig = computed(() => {
    if (statusViewState.value === 'success') {
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
    if (statusViewState.value === 'failed') {
        return {
            icon: 'x',
            eyebrow: t('status.failedEyebrow'),
            title: t('status.failedTitle'),
            description: t('status.failedDescription'),
            message: paymentResult.value?.failure?.message || t('status.failedMessage'),
            primaryAction: retryAvailable.value ? t('status.failedPrimary') : t('status.failedSecondary'),
            secondaryAction: t('status.failedSecondary'),
        };
    }
    if (statusViewState.value === 'blocked') {
        return {
            icon: '!',
            eyebrow: t('status.blockedEyebrow'),
            title: t('status.blockedTitle'),
            description: t('status.blockedDescription'),
            message: initError.value || t('status.blockedMessage'),
            primaryAction: t('status.blockedPrimary'),
            secondaryAction: t('status.blockedSecondary'),
        };
    }
    return {
        icon: '...',
        eyebrow: t('status.processingEyebrow'),
        title: t('status.processingTitle'),
        description: t('status.processingDescription'),
        message: t('status.processingMessage'),
        primaryAction: t('status.processingPrimary'),
        secondaryAction: t('status.processingSecondary'),
    };
});

const selectedMethod = computed(() => (
    supportedPaymentMethods.value.find((method) => method.id === selectedPaymentMethod.value)
    || supportedPaymentMethods.value[0]
));
const selectedMethodLabel = computed(() => selectedMethod.value?.label || '');
const statusPaymentLogoKeys = computed<PaymentLogoKey[]>(() => {
    const resultLogo = CARD_BRAND_LOGOS[normalizeCode(paymentResult.value?.result?.cardBrand)];
    if (resultLogo) {
        return [resultLogo];
    }
    const firstSelectedLogo = selectedMethod.value?.logoKeys?.[0];
    return firstSelectedLogo ? [firstSelectedLogo] : ['visa'];
});
const pollingIntervalSeconds = computed(() => (
    paymentResult.value?.polling?.intervalSeconds
    || checkoutInfo.value?.pollingIntervalSeconds
    || 3
));

watch(supportedPaymentMethods, (methods) => {
    if (!methods.some((method) => method.id === selectedPaymentMethod.value)) {
        selectedPaymentMethod.value = methods[0]?.id || '';
    }
}, { immediate: true });

watch(selectedCountry, (country) => {
    if (country?.countryCode) {
        selectedCountryCode.value = country.countryCode;
    }
}, { immediate: true });

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
        countryLoadFailed.value = false;
    } catch {
        countryLoadFailed.value = true;
        countryOptions.value = fallbackCountries();
    }
    if (!countryOptions.value.some((country) => country.countryCode === selectedCountryCode.value)) {
        selectedCountryCode.value = countryOptions.value[0]?.countryCode || '';
        if (selectedCountryCode.value) {
            writeStoredValue(COUNTRY_KEY, selectedCountryCode.value);
        }
    }
}

async function initializeCheckout() {
    const route = parseCheckoutRoute();
    const token = route.opaqueToken;
    if (!route.valid || !isRoutableCheckoutToken(token)) {
        blockCheckout(t('checkout.invalidLink'));
        return;
    }
    if (isDevToken(token)) {
        hydrateSession(mockSession(token));
        if (token === 'dev-success') {
            handlePaymentResult(mockSuccessResult());
            return;
        }
        if (token === 'dev-failed') {
            handlePaymentResult(mockFailedResult());
            return;
        }
        if (token === 'dev-processing') {
            handlePaymentResult(mockProcessingResult());
            return;
        }
        applyPageState('PAYABLE');
        return;
    }
    runtimeState.value = 'loading';
    try {
        const response = await queryCheckoutSession({
            opaqueToken: token,
            cover: routeCover.value,
            clientContext: buildClientContext(),
        });
        hydrateSession(response);
        applyPageState(response.pageState);
    } catch (error) {
        if (isDevToken(token)) {
            hydrateSession(mockSession(token));
            applyPageState('PAYABLE');
            return;
        }
        blockCheckout(error instanceof Error ? error.message : t('checkout.invalidLink'));
    }
}

function hydrateSession(response: HostedCheckoutSession) {
    session.value = response;
}

async function handleSubmitPayment() {
    formMessage.value = '';
    if (!validateForm() || !routeToken.value || !session.value || !selectedMethod.value) {
        return;
    }
    submitting.value = true;
    clearPolling();
    if (isDevToken(routeToken.value)) {
        devStatusPolls.value = 0;
        handlePaymentResult(mockThreeDsRequiredResult());
        submitting.value = false;
        return;
    }
    try {
        const expiry = parseExpiry(cardForm.expiry);
        const response = await submitCheckoutPayment({
            opaqueToken: routeToken.value,
            checkoutSessionId: session.value.checkoutSessionId,
            attemptRequestId: createAttemptRequestId(),
            paymentMethod: selectedMethod.value.paymentMethod,
            cardInfo: {
                cardNo: digitsOnly(cardForm.cardNumber),
                expirationMonth: expiry.month,
                expirationYear: expiry.year,
                securityCode: digitsOnly(cardForm.cvc),
                cardholderName: cardForm.cardholderName,
            },
            billingCardHolderInfo: {
                firstName: billingForm.firstName,
                lastName: billingForm.lastName,
                email: billingForm.email,
                phone: billingForm.phone,
                country: selectedCountryCode.value,
                state: billingForm.state,
                city: billingForm.city,
                street: billingForm.street,
                postal: billingForm.postal,
            },
            clientContext: buildClientContext(),
        });
        handlePaymentResult(response);
    } catch (error) {
        if (isDevToken(routeToken.value)) {
            devStatusPolls.value = 0;
            handlePaymentResult(mockThreeDsRequiredResult());
            return;
        }
        formMessage.value = error instanceof Error ? error.message : t('checkout.submitFailed');
    } finally {
        submitting.value = false;
    }
}

async function refreshPaymentStatus() {
    if (!routeToken.value || !session.value) {
        return;
    }
    if (isDevToken(routeToken.value)) {
        if (routeToken.value === 'dev-processing') {
            handlePaymentResult(mockProcessingResult());
            return;
        }
        if (runtimeState.value === 'threeDs') {
            return;
        }
        devStatusPolls.value += 1;
        handlePaymentResult(devStatusPolls.value >= 2 ? mockSuccessResult() : mockProcessingResult());
        return;
    }
    try {
        const response = await queryCheckoutPaymentStatus({
            opaqueToken: routeToken.value,
            checkoutSessionId: session.value.checkoutSessionId,
            checkoutAttemptId: paymentResult.value?.checkoutAttemptId,
            clientContext: buildClientContext(),
        });
        handlePaymentResult(response);
    } catch (error) {
        if (isDevToken(routeToken.value)) {
            if (routeToken.value === 'dev-processing') {
                handlePaymentResult(mockProcessingResult());
                return;
            }
            devStatusPolls.value += 1;
            handlePaymentResult(devStatusPolls.value >= 2 ? mockSuccessResult() : mockProcessingResult());
            return;
        }
        if (runtimeState.value === 'processing') {
            paymentResult.value = {
                checkoutSessionId: session.value.checkoutSessionId,
                checkoutAttemptId: paymentResult.value?.checkoutAttemptId,
                pageState: 'PROCESSING',
                failure: {
                    message: error instanceof Error ? error.message : t('checkout.statusQueryFailed'),
                },
            };
        }
    }
}

async function handleThreeDsReturnMessage(event: MessageEvent) {
    const payload = normalizeThreeDsReturnMessage(event.data);
    if (!payload || !matchesActiveThreeDsAttempt(payload)) {
        return;
    }
    if (threeDsReturnHandling.value) {
        return;
    }
    threeDsReturnHandling.value = true;
    if (isDevToken(routeToken.value)) {
        devStatusPolls.value = 0;
        handlePaymentResult(mockProcessingResult());
        threeDsReturnHandling.value = false;
        return;
    }
    try {
        const response = await returnCheckoutThreeDs({
            threeDsReturnToken: payload.threeDsReturnToken || '',
            checkoutSessionId: payload.checkoutSessionId || '',
            checkoutAttemptId: payload.checkoutAttemptId || '',
            authenticationData: JSON.stringify(payload.authenticationData || {}),
            clientContext: buildClientContext(),
        });
        handlePaymentResult(response);
    } catch (error) {
        paymentResult.value = {
            checkoutSessionId: session.value?.checkoutSessionId || payload.checkoutSessionId || '',
            checkoutAttemptId: payload.checkoutAttemptId,
            pageState: 'PROCESSING',
            failure: {
                message: error instanceof Error ? error.message : t('checkout.statusQueryFailed'),
            },
        };
        runtimeState.value = 'processing';
        startPolling();
    } finally {
        threeDsReturnHandling.value = false;
    }
}

function normalizeThreeDsReturnMessage(data: unknown): ThreeDsReturnMessage | null {
    if (!data || typeof data !== 'object') {
        return null;
    }
    const payload = data as ThreeDsReturnMessage;
    return payload.type === 'HOSTED_CHECKOUT_3DS_RETURN' ? payload : null;
}

function matchesActiveThreeDsAttempt(payload: ThreeDsReturnMessage): boolean {
    // 3DS bridge may run in a sandboxed iframe with an opaque origin, so the final trust check stays on the backend return token.
    return runtimeState.value === 'threeDs'
        && Boolean(payload.checkoutSessionId)
        && Boolean(payload.checkoutAttemptId)
        && Boolean(payload.threeDsReturnToken)
        && payload.checkoutSessionId === session.value?.checkoutSessionId
        && payload.checkoutAttemptId === paymentResult.value?.checkoutAttemptId;
}

function handlePaymentResult(response: HostedCheckoutPaymentResult) {
    paymentResult.value = response;
    applyPageState(response.pageState);
}

function applyPageState(pageState?: string) {
    const state = normalizeCode(pageState) as CheckoutPageState;
    if (state === 'PAYABLE') {
        clearPolling();
        runtimeState.value = 'checkout';
        return;
    }
    if (state === 'SUCCEEDED') {
        clearPolling();
        runtimeState.value = 'success';
        return;
    }
    if (state === 'FAILED_RETRYABLE' || state === 'FAILED_FINAL' || state === 'EXPIRED' || state === 'CANCELLED') {
        clearPolling();
        runtimeState.value = 'failed';
        return;
    }
    if (state === 'THREE_DS_REQUIRED') {
        runtimeState.value = 'threeDs';
        if (!pollTimer.value) {
            startPolling();
        }
        return;
    }
    if (state === 'PROCESSING') {
        runtimeState.value = 'processing';
        if (!pollTimer.value) {
            startPolling();
        }
        return;
    }
    blockCheckout(t('checkout.invalidLink'));
}

function retryPayment() {
    clearPolling();
    formMessage.value = '';
    paymentResult.value = null;
    runtimeState.value = 'checkout';
}

function startPolling() {
    clearPolling();
    pollAttempts.value = 0;
    scheduleNextPoll();
}

function scheduleNextPoll() {
    clearPolling();
    if (pollAttempts.value >= POLLING_MAX_ATTEMPTS) {
        runtimeState.value = 'processing';
        return;
    }
    const delayMs = Math.max(1, pollingIntervalSeconds.value) * 1000;
    pollTimer.value = window.setTimeout(async () => {
        pollAttempts.value += 1;
        await refreshPaymentStatus();
        if (runtimeState.value === 'processing' || runtimeState.value === 'threeDs') {
            scheduleNextPoll();
        }
    }, delayMs);
}

function clearPolling() {
    if (pollTimer.value) {
        window.clearTimeout(pollTimer.value);
        pollTimer.value = null;
    }
}

function blockCheckout(message: string) {
    clearPolling();
    initError.value = message;
    runtimeState.value = 'blocked';
}

function validateForm(): boolean {
    clearFieldErrors();
    if (!isValidEmail(billingForm.email)) {
        fieldErrors.email = t('checkout.validation.email');
    }
    if (!billingForm.firstName) {
        fieldErrors.firstName = t('checkout.validation.required');
    }
    if (!billingForm.lastName) {
        fieldErrors.lastName = t('checkout.validation.required');
    }
    if (!selectedCountryCode.value) {
        fieldErrors.country = t('checkout.validation.required');
    }
    if (!cardForm.cardholderName) {
        fieldErrors.cardholderName = t('checkout.validation.required');
    }
    const cardNumber = digitsOnly(cardForm.cardNumber);
    if (cardNumber.length < 12 || cardNumber.length > 19 || !luhnValid(cardNumber)) {
        fieldErrors.cardNumber = t('checkout.validation.cardNumber');
    }
    const expiry = parseExpiry(cardForm.expiry);
    if (!expiry.valid) {
        fieldErrors.expiry = t('checkout.validation.expiry');
    }
    const cvc = digitsOnly(cardForm.cvc);
    if (cvc.length < 3 || cvc.length > 4) {
        fieldErrors.cvc = t('checkout.validation.cvc');
    }
    return Object.keys(fieldErrors).length === 0;
}

function clearFieldErrors() {
    Object.keys(fieldErrors).forEach((key) => {
        delete fieldErrors[key as keyof FieldErrors];
    });
}

function formatCardNumber() {
    cardForm.cardNumber = digitsOnly(cardForm.cardNumber).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry() {
    const value = digitsOnly(cardForm.expiry).slice(0, 4);
    cardForm.expiry = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;
}

function formatCvc() {
    cardForm.cvc = digitsOnly(cardForm.cvc).slice(0, 4);
}

function parseExpiry(value: string): { month: string; year: string; valid: boolean } {
    const digits = digitsOnly(value);
    if (digits.length !== 4) {
        return { month: '', year: '', valid: false };
    }
    const month = digits.slice(0, 2);
    const yearSuffix = digits.slice(2);
    const monthNumber = Number(month);
    const fullYear = Number(`20${yearSuffix}`);
    const expiryDate = new Date(fullYear, monthNumber, 0, 23, 59, 59);
    return {
        month,
        year: String(fullYear),
        valid: monthNumber >= 1 && monthNumber <= 12 && expiryDate >= new Date(),
    };
}

function luhnValid(value: string): boolean {
    let sum = 0;
    let shouldDouble = false;
    for (let index = value.length - 1; index >= 0; index -= 1) {
        let digit = Number(value.charAt(index));
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum > 0 && sum % 10 === 0;
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function digitsOnly(value: string): string {
    return value.replace(/\D/g, '');
}

function buildClientContext(): HostedCheckoutClientContext {
    return {
        timezoneOffset: String(new Date().getTimezoneOffset()),
        language: language.value,
        screen: `${window.screen.width}x${window.screen.height}`,
        deviceId: getOrCreateDeviceId(),
    };
}

function getOrCreateDeviceId(): string {
    const existing = readStoredValue(DEVICE_ID_KEY);
    if (existing) {
        return existing;
    }
    const value = `HC${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    writeStoredValue(DEVICE_ID_KEY, value);
    return value;
}

function createAttemptRequestId(): string {
    return `ATT${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function parseCheckoutRoute(): { opaqueToken: string; cover: string; valid: boolean } {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const checkoutIndex = parts.findIndex((part) => part === 'checkout');
    if (checkoutIndex < 0 || checkoutIndex !== 0 || parts.length !== 3) {
        return { opaqueToken: '', cover: '', valid: false };
    }
    const opaqueToken = decodeURIComponent(parts[checkoutIndex + 1] || '');
    const cover = decodeURIComponent(parts[checkoutIndex + 2] || '');
    return {
        opaqueToken,
        cover,
        valid: Boolean(opaqueToken && cover),
    };
}

function isRoutableCheckoutToken(token: string): boolean {
    if (!token) {
        return false;
    }
    if (isDevToken(token)) {
        return true;
    }
    return token.length >= 24 && /^[A-Za-z0-9._~-]+$/.test(token);
}

function toPaymentOption(method: HostedCheckoutPaymentMethod): PaymentOption {
    const brands = method.brands?.length ? method.brands : ['VISA', 'MASTERCARD', 'JCB', 'MAESTRO'];
    const logoKeys = uniqueLogos(brands
        .map((brand) => CARD_BRAND_LOGOS[normalizeCode(brand)])
        .filter((logo): logo is PaymentLogoKey => Boolean(logo)));
    const channelCode = normalizeCode(method.channelCode || 'MPGS');
    return {
        id: `${normalizeCode(method.paymentMethod)}-${channelCode}`,
        paymentMethod: normalizeCode(method.paymentMethod),
        channelCode,
        label: t('checkout.bankCardLabel'),
        description: brands.join(' / '),
        logoKeys,
        threeDsMode: method.threeDsMode,
    };
}

function uniqueLogos(logos: PaymentLogoKey[]): PaymentLogoKey[] {
    return Array.from(new Set(logos));
}

function normalizeCode(value?: string): string {
    return value?.trim().toUpperCase() || '';
}

function parseOrderItems(itemsJson?: string) {
    if (!itemsJson) {
        return [];
    }
    try {
        const parsed = JSON.parse(itemsJson);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function formatMoney(amount?: number | string, currency = 'USD'): string {
    const numericAmount = Number(amount ?? 0);
    if (!Number.isFinite(numericAmount)) {
        return `${currency} ${amount || '0.00'}`;
    }
    try {
        return new Intl.NumberFormat(language.value, {
            style: 'currency',
            currency,
            currencyDisplay: 'code',
        }).format(numericAmount);
    } catch {
        return `${currency} ${numericAmount.toFixed(2)}`;
    }
}

function formatDateTime(value?: string): string {
    if (!value) {
        return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value.replace('T', ' ');
    }
    return new Intl.DateTimeFormat(language.value, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(date);
}

function readablePageState(value?: string): string {
    const state = normalizeCode(value);
    if (!state) {
        return t('checkout.statusLoading');
    }
    return t(`pageState.${state}`, state);
}

function goToReturnUrl() {
    const url = paymentResult.value?.actions?.returnUrl;
    if (url) {
        window.location.assign(url);
    }
}

function goToCancelUrl() {
    const url = paymentResult.value?.actions?.cancelUrl;
    if (url) {
        window.location.assign(url);
        return;
    }
    goToReturnUrl();
}

function fallbackCountries(): CheckoutCountryConfig[] {
    return [
        {
            countryCode: 'USA',
            countryName: 'United States',
            countryNameLocal: 'United States',
            flagIconUrl: COUNTRY_FLAG_ASSETS.USA,
            defaultLanguage: 'en-US',
            supportedLanguages: ['en-US'],
            sortNo: 1,
        },
        {
            countryCode: 'CHN',
            countryName: 'China',
            countryNameLocal: '中国',
            flagIconUrl: COUNTRY_FLAG_ASSETS.CHN,
            defaultLanguage: 'zh-CN',
            supportedLanguages: ['zh-CN', 'en-US'],
            sortNo: 2,
        },
    ];
}

function mockSession(token = 'dev-token'): HostedCheckoutSession {
    return {
        checkoutSessionId: token === 'dev-unpaid' ? 'CSDEVUNPAID202607270001' : 'CSDEV202607270001',
        pageState: 'PAYABLE',
        merchant: {
            displayName: 'Vexra Lifestyle Flagship',
            logoUrl: checkoutBrand.logos.icon,
        },
        order: {
            orderNo: token === 'dev-unpaid' ? 'DEVUNPAID202607270001' : 'DEV202607270001',
            subject: 'Cloud Repair Serum',
            description: 'Hosted Checkout local demo order',
            amount: '49.97',
            currency: 'USD',
            currencyExponent: 2,
            itemsJson: JSON.stringify([
                { name: 'Cloud Repair Serum', quantity: 1, amount: '9.99', currency: 'USD' },
                { name: 'Sea Salt Skincare Set', quantity: 2, amount: '39.98', currency: 'USD' },
            ]),
        },
        paymentMethods: [{
            paymentMethod: 'BANK_CARD',
            channelCode: 'MPGS',
            brands: ['VISA', 'MASTERCARD', 'JCB', 'MAESTRO'],
            threeDsMode: 'AUTO',
        }],
        checkout: {
            retryAllowed: true,
            remainingAttemptCount: 3,
            pollingIntervalSeconds: 2,
        },
    };
}

function mockThreeDsRequiredResult(): HostedCheckoutPaymentResult {
    const checkoutSessionId = session.value?.checkoutSessionId || 'CSDEV202607270001';
    const checkoutAttemptId = 'CADEV202607270001';
    const threeDsReturnToken = 'dev-return-token';
    return {
        checkoutSessionId,
        checkoutAttemptId,
        pageState: 'THREE_DS_REQUIRED',
        threeDsAction: {
            actionType: 'HTML',
            html: `
                <main style="font-family: Inter, Arial, sans-serif; padding: 28px; color: #0f172a;">
                    <p style="margin: 0 0 8px; color: #475569; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;">VISA SECURE</p>
                    <h2 style="margin: 0 0 12px; font-size: 24px;">Approve this demo payment</h2>
                    <p style="margin: 0 0 18px; color: #64748b; line-height: 1.6;">This local development challenge simulates an issuer 3DS authentication page.</p>
                    <button
                        type="button"
                        onclick="parent.postMessage({type:'HOSTED_CHECKOUT_3DS_RETURN', checkoutSessionId:'${checkoutSessionId}', checkoutAttemptId:'${checkoutAttemptId}', threeDsReturnToken:'${threeDsReturnToken}', authenticationData:{result:'AUTHENTICATED'}}, '*')"
                        style="height: 44px; padding: 0 18px; border: 0; border-radius: 12px; background: #4f46e5; color: white; font-weight: 800;"
                    >Authentication completed</button>
                </main>
            `,
            timeoutSeconds: 300,
        },
        polling: {
            intervalSeconds: 6,
            maxIntervalSeconds: 5,
        },
    };
}

function mockProcessingResult(): HostedCheckoutPaymentResult {
    return {
        checkoutSessionId: session.value?.checkoutSessionId || 'CSDEV202607270001',
        checkoutAttemptId: routeToken.value === 'dev-processing' ? 'CADEVPROCESSING202607270001' : paymentResult.value?.checkoutAttemptId || 'CADEV202607270001',
        pageState: 'PROCESSING',
        result: {
            amount: order.value?.amount || '49.97',
            currency: order.value?.currency || 'USD',
            merchantOrderNo: order.value?.orderNo || 'DEV202607270001',
            paymentMethod: selectedMethod.value?.label || 'Bank Card',
            cardBrand: 'VISA',
            cardNumberMasked: '**** 1111',
            transactionId: 'TXDEVPROCESSING202607270001',
            transactionDateTime: new Date().toISOString(),
        },
        polling: {
            intervalSeconds: 2,
            maxIntervalSeconds: 5,
        },
    };
}

function mockSuccessResult(): HostedCheckoutPaymentResult {
    const cardNumber = digitsOnly(cardForm.cardNumber);
    return {
        checkoutSessionId: session.value?.checkoutSessionId || 'CSDEV202607270001',
        checkoutAttemptId: paymentResult.value?.checkoutAttemptId || 'CADEV202607270001',
        pageState: 'SUCCEEDED',
        result: {
            amount: order.value?.amount || '49.97',
            currency: order.value?.currency || 'USD',
            merchantOrderNo: order.value?.orderNo || 'DEV202607270001',
            paymentMethod: selectedMethod.value?.label || 'Bank Card',
            cardBrand: 'VISA',
            cardNumberMasked: cardNumber ? `**** ${cardNumber.slice(-4)}` : '**** 1111',
            transactionId: `TXDEV${Date.now()}`,
            transactionDateTime: new Date().toISOString(),
            authCode: 'DEV3DS',
        },
    };
}

function mockFailedResult(): HostedCheckoutPaymentResult {
    return {
        checkoutSessionId: session.value?.checkoutSessionId || 'CSDEV202607270001',
        checkoutAttemptId: 'CADEVFAILED202607270001',
        pageState: 'FAILED_RETRYABLE',
        result: {
            amount: order.value?.amount || '49.97',
            currency: order.value?.currency || 'USD',
            merchantOrderNo: order.value?.orderNo || 'DEV202607270001',
            paymentMethod: selectedMethod.value?.label || 'Bank Card',
            cardBrand: 'VISA',
            cardNumberMasked: '**** 1111',
            transactionId: 'TXDEVFAILED202607270001',
            transactionDateTime: new Date().toISOString(),
        },
        failure: {
            reasonCode: 'ISSUER_DECLINED',
            message: t('status.failedHelpDesc'),
            retryAllowed: true,
            remainingAttemptCount: 2,
        },
        actions: {
            returnUrl: '',
            cancelUrl: '',
        },
    };
}

function isDevToken(token: string): boolean {
    return import.meta.env.DEV && ['dev-token', 'dev-unpaid', 'dev-success', 'dev-failed', 'dev-processing'].includes(token);
}

applyLocale(resolveInitialLocale(), false);

onMounted(async () => {
    window.addEventListener('message', handleThreeDsReturnMessage);
    await initializeCheckout();
    if (runtimeState.value === 'checkout') {
        await loadCountries();
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('message', handleThreeDsReturnMessage);
    clearPolling();
});
</script>
