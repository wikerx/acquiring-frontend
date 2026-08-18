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
                            <option value="en-US">{{ t('topbar.english') }}</option>
                            <option value="zh-CN">{{ t('topbar.chinese') }}</option>
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
                        <PaymentLogoGroup
                            class="checkout-section-card__logos"
                            :keys="paymentHeaderLogoKeys"
                            size="sm"
                            align="end"
                        />
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
                                        @blur="handleCardNumberBlur"
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
                                            type="password"
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
                    :key="threeDsFrameKey"
                    :class="['checkout-three-ds-frame', { 'checkout-three-ds-frame--method': threeDsPhase === 'INITIALIZE' }]"
                    :srcdoc="threeDsHtml"
                    sandbox="allow-forms allow-scripts"
                    title="3DS authentication"
                ></iframe>
                <div v-if="threeDsPhase === 'INITIALIZE' || !threeDsHtml" class="checkout-processing-box">
                    <span>{{ t('checkout.threeDsRedirectLabel') }}</span>
                    <strong>{{ t('checkout.threeDsRedirectTitle') }}</strong>
                    <p>{{ t('checkout.threeDsRedirectDescription') }}</p>
                </div>
                <div class="checkout-status-actions">
                    <button class="checkout-status-button checkout-status-button--primary" type="button" @click="refreshPaymentStatus">
                        {{ t('status.processingPrimary') }}
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

                <p v-if="redirectCountdown !== null" class="checkout-redirect-countdown" role="status">
                    {{ t('status.redirectCountdown', { seconds: redirectCountdown }) }}
                </p>

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
                        v-else-if="hasMerchantRedirect"
                        class="checkout-status-button checkout-status-button--primary"
                        type="button"
                        @click="submitMerchantReturnForm"
                    >
                        {{ localizedStatusConfig.primaryAction }}
                    </button>
                    <button
                        v-if="statusViewState !== 'blocked'"
                        class="checkout-status-button checkout-status-button--secondary"
                        type="button"
                        :disabled="receiptDownloading"
                        @click="downloadCurrentReceipt"
                    >
                        {{ receiptDownloading ? t('status.downloadingReceipt') : t('status.downloadReceipt') }}
                    </button>
                    <button
                        v-if="hasMerchantRedirect && (statusViewState === 'processing' || (statusViewState === 'failed' && retryAvailable))"
                        class="checkout-status-button checkout-status-button--secondary"
                        type="button"
                        @click="submitMerchantReturnForm"
                    >
                        {{ t('status.returnToMerchant') }}
                    </button>
                </div>
                <p v-if="receiptError" class="checkout-receipt-error" role="alert">
                    {{ receiptError }}
                </p>
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
    resolveCheckoutCardBin,
    returnCheckoutThreeDs,
    submitCheckoutPayment,
    type CheckoutPageState,
    type HostedCheckoutClientContext,
    type HostedCheckoutCardDataEnvelope,
    type HostedCheckoutCardEncryption,
    type HostedCheckoutPaymentMethod,
    type HostedCheckoutPaymentResult,
    type HostedCheckoutMerchantReturnFormFields,
    type HostedCheckoutSession,
} from './api/hostedCheckout';
import CheckoutTrustFooter from './components/CheckoutTrustFooter.vue';
import { downloadReceiptPdf, type ReceiptRow, type ReceiptStatus } from './utils/receiptPdf';

type CheckoutRuntimeState = 'loading' | 'checkout' | 'threeDs' | 'success' | 'failed' | 'processing' | 'blocked';
type CheckoutStatusViewState = 'success' | 'failed' | 'processing' | 'blocked';
type CheckoutLocale = 'en-US' | 'zh-CN';

interface PaymentOption {
    id: string;
    paymentMethod: string;
    channelCode?: string;
    label: string;
    description: string;
    brands: string[];
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

interface CheckoutCardData {
    cardNo: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
    cardholderName: string;
}

interface ThreeDsContinuationContext {
    cardData: CheckoutCardData;
    billingCardHolderInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        country: string;
        state?: string;
        city?: string;
        street?: string;
        postal?: string;
    };
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
const THREE_DS_RECOVERY_WAIT_SECONDS = 660;
const THREE_DS_METHOD_WAIT_MS = 10_000;
const MERCHANT_RETURN_FIELD_NAMES: ReadonlyArray<keyof HostedCheckoutMerchantReturnFormFields> = [
    'merchantId',
    'orderNo',
    'orderId',
    'transactionId',
    'transactionType',
    'transactionStatus',
    'transactionDateTime',
    'code',
    'message',
];
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
const FAILURE_REASON_I18N_KEYS: Record<string, string> = {
    RISK_REJECTED: 'status.failureReasons.RISK_REJECTED',
    ROUTE_FAILED: 'status.failureReasons.ROUTE_FAILED',
    CHANNEL_UNSUPPORTED: 'status.failureReasons.CHANNEL_UNSUPPORTED',
    EXCHANGE_RATE_NOT_FOUND: 'status.failureReasons.EXCHANGE_RATE_NOT_FOUND',
    CHANNEL_REQUEST_FAILED: 'status.failureReasons.CHANNEL_REQUEST_FAILED',
    CHANNEL_RESPONSE_INVALID: 'status.failureReasons.CHANNEL_RESPONSE_INVALID',
    CHANNEL_TIMEOUT: 'status.failureReasons.CHANNEL_TIMEOUT',
    STATE_TRANSITION_DENIED: 'status.failureReasons.STATE_TRANSITION_DENIED',
    ISSUER_DECLINED: 'status.failureReasons.ISSUER_DECLINED',
    THREE_DS_FAILED: 'status.failureReasons.THREE_DS_FAILED',
};

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
const formMessageKey = ref('');
const formMessage = computed(() => formMessageKey.value ? t(formMessageKey.value) : '');
const fieldErrors = reactive<FieldErrors>({});
const pollTimer = ref<number | null>(null);
const pollAttempts = ref(0);
const pollAttemptLimit = ref(POLLING_MAX_ATTEMPTS);
const redirectCountdown = ref<number | null>(null);
const redirectTimer = ref<number | null>(null);
const redirectSubmitted = ref(false);
const devStatusPolls = ref(0);
const initErrorKey = ref('');
const initErrorText = computed(() => initErrorKey.value ? t(initErrorKey.value) : '');
const threeDsReturnHandling = ref(false);
const threeDsContinuation = ref<ThreeDsContinuationContext | null>(null);
const threeDsMethodTimer = ref<number | null>(null);
const receiptDownloading = ref(false);
const receiptError = ref('');
const attemptRequestId = ref(createAttemptRequestId());
const resolvedCardBin = ref('');
const resolvedCardBrand = ref('');
const resolvedCardSupported = ref<boolean | null>(null);
let cardBinRequestSequence = 0;

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
const statusChipText = computed(() => readablePageState(
    runtimeState.value === 'processing' ? 'PROCESSING' : latestPageState.value,
));
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
const failureReasonText = computed(() => localizedFailureReason(paymentResult.value?.failure?.reasonCode));
const failureHelpText = computed(() => failureReasonText.value);
const hasMerchantRedirect = computed(() => resolveMerchantRedirectUrl() !== null);
const threeDsHtml = computed(() => paymentResult.value?.threeDsAction?.actionType === 'HTML'
    ? paymentResult.value?.threeDsAction?.html || ''
    : '');
const threeDsPhase = computed(() => normalizeCode(paymentResult.value?.threeDsAction?.phase));
const threeDsFrameKey = computed(() => (
    `${paymentResult.value?.checkoutAttemptId || 'pending'}:${threeDsPhase.value || 'unknown'}`
));

const paymentHeaderLogoKeys = computed<PaymentLogoKey[]>(() => {
    const logos = supportedPaymentMethods.value.flatMap((method) => method.logoKeys);
    return uniqueLogos(logos);
});
const trustbarLogoKeys = computed<PaymentLogoKey[]>(() => paymentHeaderLogoKeys.value);

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
        rows.push({ label: t('status.failureReason'), value: failureReasonText.value });
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
    initErrorText.value || t('status.blockedReasonInvalidRequest'),
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
            message: t('status.failedMessage'),
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
            message: initErrorText.value || t('status.blockedMessage'),
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
        blockCheckout('checkout.invalidLink');
        return;
    }
    if (isDevToken(token)) {
        hydrateSession(mockSession(token));
        if (token === 'dev-success' || token === 'dev-success-redirect') {
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
        if (token === 'dev-3ds-recovery') {
            handlePaymentResult(await mockThreeDsRequiredResult());
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
    } catch {
        if (isDevToken(token)) {
            hydrateSession(mockSession(token));
            applyPageState('PAYABLE');
            return;
        }
        blockCheckout('checkout.invalidLink');
    }
}

function hydrateSession(response: HostedCheckoutSession) {
    session.value = response;
    paymentResult.value = response.paymentResult || null;
    hydratePrefill(response);
}

function hydratePrefill(response: HostedCheckoutSession) {
    const prefill = response.billingInfo || response.payerInfo;
    if (!prefill) {
        return;
    }
    billingForm.email = prefill.email || '';
    billingForm.firstName = prefill.firstName || '';
    billingForm.lastName = prefill.lastName || '';
    billingForm.phone = prefill.phone || '';
    billingForm.state = prefill.state || '';
    billingForm.city = prefill.city || '';
    billingForm.street = prefill.street || '';
    billingForm.postal = prefill.postal || '';
    if (prefill.country) {
        selectedCountryCode.value = normalizeCode(prefill.country);
    }
    if (!cardForm.cardholderName) {
        cardForm.cardholderName = [prefill.firstName, prefill.lastName].filter(Boolean).join(' ');
    }
}

async function handleSubmitPayment() {
    if (submitting.value) {
        return;
    }
    formMessageKey.value = '';
    if (!validateForm() || !routeToken.value || !session.value || !selectedMethod.value) {
        return;
    }
    submitting.value = true;
    clearPolling();
    try {
        if (!await ensureCardBrandSupported()) {
            return;
        }
        const expiry = parseExpiry(cardForm.expiry);
        const cardData: CheckoutCardData = {
            cardNo: digitsOnly(cardForm.cardNumber),
            expirationMonth: expiry.month,
            expirationYear: expiry.year,
            securityCode: digitsOnly(cardForm.cvc),
            cardholderName: cardForm.cardholderName,
        };
        const billingCardHolderInfo = {
            firstName: billingForm.firstName,
            lastName: billingForm.lastName,
            email: billingForm.email,
            phone: billingForm.phone,
            country: selectedCountryCode.value,
            state: billingForm.state,
            city: billingForm.city,
            street: billingForm.street,
            postal: billingForm.postal,
        };
        if (isDevToken(routeToken.value)) {
            if (routeToken.value === 'dev-3ds') {
                threeDsContinuation.value = { cardData, billingCardHolderInfo };
                cardForm.cvc = '';
                devStatusPolls.value = 0;
                handlePaymentResult(await mockThreeDsRequiredResult());
                return;
            }
            handlePaymentResult(mockSuccessResult());
            return;
        }
        const cardDataEnvelope = await encryptCardData(
            session.value.cardEncryption,
            session.value.checkoutSessionId,
            attemptRequestId.value,
            cardData,
        );
        threeDsContinuation.value = { cardData, billingCardHolderInfo };
        cardForm.cvc = '';
        const response = await submitCheckoutPayment({
            opaqueToken: routeToken.value,
            checkoutSessionId: session.value.checkoutSessionId,
            attemptRequestId: attemptRequestId.value,
            paymentMethod: selectedMethod.value.paymentMethod,
            cardDataEnvelope,
            billingCardHolderInfo,
            clientContext: buildClientContext(),
        });
        handlePaymentResult(response);
    } catch {
        clearThreeDsContinuation();
        if (isDevToken(routeToken.value)) {
            devStatusPolls.value = 0;
            handlePaymentResult(await mockThreeDsRequiredResult());
            return;
        }
        formMessageKey.value = 'checkout.submitFailed';
        await refreshSessionEncryption();
    } finally {
        submitting.value = false;
    }
}

async function refreshPaymentStatus() {
    if (!routeToken.value || !session.value) {
        return;
    }
    if (isDevToken(routeToken.value)) {
        if (routeToken.value === 'dev-success') {
            handlePaymentResult(mockSuccessResult());
            return;
        }
        if (routeToken.value === 'dev-failed') {
            handlePaymentResult(mockFailedResult());
            return;
        }
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
    } catch {
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
                    reasonCode: 'CHANNEL_RESPONSE_INVALID',
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
        await continueThreeDs(payload);
    } catch {
        paymentResult.value = {
            checkoutSessionId: session.value?.checkoutSessionId || payload.checkoutSessionId || '',
            checkoutAttemptId: payload.checkoutAttemptId,
            pageState: 'PROCESSING',
            failure: {
                reasonCode: 'CHANNEL_RESPONSE_INVALID',
            },
        };
        runtimeState.value = 'processing';
        startPolling();
    } finally {
        threeDsReturnHandling.value = false;
    }
}

async function continueThreeDs(payload: ThreeDsReturnMessage) {
    const continuation = threeDsContinuation.value;
    const action = paymentResult.value?.threeDsAction;
    const checkoutSessionId = payload.checkoutSessionId || '';
    const checkoutAttemptId = payload.checkoutAttemptId || '';
    const threeDsReturnToken = payload.threeDsReturnToken || extractThreeDsReturnToken(action?.returnUrl);
    if (!continuation || !action?.cardEncryption || !checkoutSessionId || !checkoutAttemptId || !threeDsReturnToken) {
        throw new Error('3DS continuation context is unavailable');
    }
    const cardDataEnvelope = await encryptCardData(
        action.cardEncryption,
        checkoutSessionId,
        attemptRequestId.value,
        continuation.cardData,
    );
    const response = await returnCheckoutThreeDs({
        threeDsReturnToken,
        checkoutSessionId,
        checkoutAttemptId,
        authenticationData: JSON.stringify(payload.authenticationData || {}),
        cardDataEnvelope,
        billingCardHolderInfo: continuation.billingCardHolderInfo,
        clientContext: buildClientContext(),
    });
    handlePaymentResult(response);
}

function extractThreeDsReturnToken(returnUrl?: string): string {
    if (!returnUrl) {
        return '';
    }
    try {
        return new URL(returnUrl, window.location.origin).searchParams.get('threeDsReturnToken') || '';
    } catch {
        return '';
    }
}

function scheduleThreeDsMethodContinuation() {
    clearThreeDsMethodTimer();
    const action = paymentResult.value?.threeDsAction;
    if (normalizeCode(action?.phase) !== 'INITIALIZE'
        || !action?.html
        || !action.returnUrl
        || !session.value
        || !paymentResult.value?.checkoutAttemptId) {
        return;
    }
    threeDsMethodTimer.value = window.setTimeout(async () => {
        threeDsMethodTimer.value = null;
        if (threeDsReturnHandling.value || runtimeState.value !== 'threeDs') {
            return;
        }
        threeDsReturnHandling.value = true;
        try {
            await continueThreeDs({
                type: 'HOSTED_CHECKOUT_3DS_RETURN',
                checkoutSessionId: session.value?.checkoutSessionId,
                checkoutAttemptId: paymentResult.value?.checkoutAttemptId,
                threeDsReturnToken: extractThreeDsReturnToken(action.returnUrl),
                authenticationData: { result: 'METHOD_COMPLETED' },
            });
        } catch {
            runtimeState.value = 'processing';
            startPolling();
        } finally {
            threeDsReturnHandling.value = false;
        }
    }, THREE_DS_METHOD_WAIT_MS);
}

function clearThreeDsMethodTimer() {
    if (threeDsMethodTimer.value) {
        window.clearTimeout(threeDsMethodTimer.value);
        threeDsMethodTimer.value = null;
    }
}

function clearThreeDsContinuation() {
    clearThreeDsMethodTimer();
    threeDsContinuation.value = null;
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
    const activeResult = paymentResult.value;
    paymentResult.value = normalizeCode(response.pageState) === 'THREE_DS_REQUIRED'
        && !response.threeDsAction
        && activeResult !== null
        && activeResult?.checkoutAttemptId === response.checkoutAttemptId
        && Boolean(activeResult.threeDsAction)
        ? { ...response, threeDsAction: activeResult.threeDsAction }
        : response;
    applyPageState(response.pageState);
}

function applyPageState(pageState?: string) {
    const state = normalizeCode(pageState) as CheckoutPageState;
    if (state === 'PAYABLE') {
        clearMerchantRedirect();
        clearPolling();
        clearThreeDsContinuation();
        runtimeState.value = 'checkout';
        return;
    }
    if (state === 'SUCCEEDED') {
        clearPolling();
        clearThreeDsContinuation();
        runtimeState.value = 'success';
        startMerchantRedirectCountdown();
        return;
    }
    if (state === 'FAILED_RETRYABLE' || state === 'FAILED_FINAL' || state === 'EXPIRED' || state === 'CANCELLED') {
        clearPolling();
        clearThreeDsContinuation();
        runtimeState.value = 'failed';
        startMerchantRedirectCountdown();
        return;
    }
    if (state === 'THREE_DS_REQUIRED') {
        clearMerchantRedirect();
        const canContinueThreeDs = Boolean(paymentResult.value?.threeDsAction && threeDsContinuation.value);
        if (canContinueThreeDs) {
            clearPolling();
            runtimeState.value = 'threeDs';
            scheduleThreeDsMethodContinuation();
            return;
        }
        clearThreeDsContinuation();
        runtimeState.value = 'processing';
        if (!pollTimer.value) {
            startPolling(Math.ceil(THREE_DS_RECOVERY_WAIT_SECONDS / Math.max(1, pollingIntervalSeconds.value)));
        }
        return;
    }
    if (state === 'PROCESSING') {
        clearMerchantRedirect();
        clearThreeDsContinuation();
        runtimeState.value = 'processing';
        if (!pollTimer.value) {
            startPolling();
        }
        return;
    }
    blockCheckout('checkout.invalidLink');
}

async function retryPayment() {
    clearPolling();
    formMessageKey.value = '';
    paymentResult.value = null;
    attemptRequestId.value = createAttemptRequestId();
    cardForm.cardNumber = '';
    cardForm.expiry = '';
    cardForm.cvc = '';
    resetCardBinResolution();
    if (isDevToken(routeToken.value)) {
        runtimeState.value = 'checkout';
        if (countryOptions.value.length === 0) {
            await loadCountries();
        }
        return;
    }
    runtimeState.value = 'loading';
    try {
        const response = await queryCheckoutSession({
            opaqueToken: routeToken.value,
            cover: routeCover.value,
            clientContext: buildClientContext(),
        });
        hydrateSession(response);
        const pageState = normalizeCode(response.pageState);
        if (isRetryablePageState(pageState)
            && response.checkout?.retryAllowed
            && response.cardEncryption) {
            session.value = { ...response, pageState: 'PAYABLE', paymentResult: undefined };
            paymentResult.value = null;
            runtimeState.value = 'checkout';
            if (countryOptions.value.length === 0) {
                await loadCountries();
            }
            return;
        }
        applyPageState(response.pageState);
        if (pageState === 'PAYABLE' && countryOptions.value.length === 0) {
            await loadCountries();
        }
    } catch {
        blockCheckout('checkout.invalidLink');
    }
}

async function refreshSessionEncryption() {
    if (!routeToken.value || !session.value || isDevToken(routeToken.value)) {
        return;
    }
    try {
        const response = await queryCheckoutSession({
            opaqueToken: routeToken.value,
            cover: routeCover.value,
            clientContext: buildClientContext(),
        });
        session.value.cardEncryption = response.cardEncryption;
        if (response.paymentResult) {
            handlePaymentResult(response.paymentResult);
        }
    } catch {
        // The current error remains visible; a later retry will query the session again.
    }
}

function startPolling(maxAttempts = POLLING_MAX_ATTEMPTS) {
    clearPolling();
    pollAttempts.value = 0;
    pollAttemptLimit.value = Math.max(POLLING_MAX_ATTEMPTS, maxAttempts);
    scheduleNextPoll();
}

function scheduleNextPoll() {
    clearPolling();
    if (pollAttempts.value >= pollAttemptLimit.value) {
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

function blockCheckout(messageKey: string) {
    clearMerchantRedirect();
    clearPolling();
    clearThreeDsContinuation();
    initErrorKey.value = messageKey;
    runtimeState.value = 'blocked';
}

/** 使用稳定失败原因码选择当前语言文案，禁止展示渠道或后端返回的原始消息。 */
function localizedFailureReason(reasonCode?: string): string {
    const key = FAILURE_REASON_I18N_KEYS[normalizeCode(reasonCode)] || 'status.failureReasons.UNKNOWN';
    return t(key);
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
    const currentBin = cardBinPrefix(cardForm.cardNumber);
    if (currentBin !== resolvedCardBin.value) {
        resetCardBinResolution();
    }
    delete fieldErrors.cardNumber;
}

async function handleCardNumberBlur() {
    const cardNumber = digitsOnly(cardForm.cardNumber);
    if (cardNumber.length < 6) {
        return;
    }
    await ensureCardBrandSupported();
}

/** BIN 结论必须来自当前会话的 MID 能力；查询不可用时失败关闭，禁止继续提交支付。 */
async function ensureCardBrandSupported(): Promise<boolean> {
    if (!session.value || !routeToken.value || !selectedMethod.value) {
        return false;
    }
    const cardNumber = digitsOnly(cardForm.cardNumber);
    if (cardNumber.length < 6) {
        return false;
    }
    const cardBin = cardBinPrefix(cardNumber);
    if (resolvedCardBin.value === cardBin && resolvedCardSupported.value !== null) {
        applyCardBrandValidation();
        return resolvedCardSupported.value;
    }
    const requestSequence = ++cardBinRequestSequence;
    try {
        if (isDevToken(routeToken.value)) {
            const cardBrand = resolveDevCardBrand(cardNumber);
            resolvedCardBin.value = cardBin;
            resolvedCardBrand.value = cardBrand;
            resolvedCardSupported.value = selectedMethod.value.brands.includes(cardBrand);
        } else {
            const result = await resolveCheckoutCardBin({
                opaqueToken: routeToken.value,
                checkoutSessionId: session.value.checkoutSessionId,
                cardBin,
            });
            if (requestSequence !== cardBinRequestSequence || cardBin !== cardBinPrefix(cardForm.cardNumber)) {
                return false;
            }
            resolvedCardBin.value = cardBin;
            resolvedCardBrand.value = normalizeCode(result.cardBrand) || 'UNKNOWN';
            resolvedCardSupported.value = result.recognized && result.supported;
        }
        applyCardBrandValidation();
        return resolvedCardSupported.value === true;
    } catch {
        if (requestSequence === cardBinRequestSequence) {
            resolvedCardBin.value = cardBin;
            resolvedCardBrand.value = '';
            resolvedCardSupported.value = false;
            fieldErrors.cardNumber = t('checkout.validation.cardBrandUnavailable');
        }
        return false;
    }
}

function applyCardBrandValidation() {
    if (resolvedCardSupported.value === true) {
        delete fieldErrors.cardNumber;
        return;
    }
    fieldErrors.cardNumber = t('checkout.validation.cardBrandUnsupported', {
        brand: resolvedCardBrand.value || t('checkout.validation.unknownCardBrand'),
    });
}

function resetCardBinResolution() {
    cardBinRequestSequence += 1;
    resolvedCardBin.value = '';
    resolvedCardBrand.value = '';
    resolvedCardSupported.value = null;
}

function isRetryablePageState(pageState: string): boolean {
    return pageState === 'FAILED_RETRYABLE';
}

function cardBinPrefix(value: string): string {
    const digits = digitsOnly(value);
    return digits.slice(0, Math.min(11, digits.length));
}

function resolveDevCardBrand(value: string): string {
    const digits = digitsOnly(value);
    if (digits.startsWith('4')) return 'VISA';
    if (digits.startsWith('34') || digits.startsWith('37')) return 'AMEX';
    if (digits.startsWith('35')) return 'JCB';
    if (digits.startsWith('5') || digits.startsWith('22')) return 'MASTERCARD';
    if (digits.startsWith('62')) return 'UNIONPAY';
    if (digits.startsWith('6011') || digits.startsWith('65')) return 'DISCOVER';
    return 'UNKNOWN';
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

/** 卡数据只以 Web Crypto 信封离开浏览器；AAD 与 payment 服务协议保持逐字节一致。 */
async function encryptCardData(
    metadata: HostedCheckoutCardEncryption | undefined,
    checkoutSessionId: string,
    currentAttemptRequestId: string,
    cardData: {
        cardNo: string;
        expirationMonth: string;
        expirationYear: string;
        securityCode: string;
        cardholderName: string;
    },
): Promise<HostedCheckoutCardDataEnvelope> {
    if (!metadata
        || metadata.algorithm !== 'RSA-OAEP-256+A256GCM'
        || !metadata.keyId
        || !metadata.publicKey
        || !metadata.nonce
        || !window.crypto?.subtle) {
        throw new Error('Checkout card encryption is unavailable');
    }
    const publicKeyBytes = decodeBase64(metadata.publicKey);
    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBytes.buffer as ArrayBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt'],
    );
    const contentKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt'],
    );
    const rawContentKey = await window.crypto.subtle.exportKey('raw', contentKey);
    const encryptedKey = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        rawContentKey,
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const aad = new TextEncoder().encode(
        `checkout-card-v1|${checkoutSessionId}|${currentAttemptRequestId}|${metadata.nonce}`,
    );
    const plaintext = new TextEncoder().encode(JSON.stringify(cardData));
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
        contentKey,
        plaintext,
    );
    return {
        algorithm: metadata.algorithm,
        keyId: metadata.keyId,
        encryptedKey: encodeBase64Url(new Uint8Array(encryptedKey)),
        iv: encodeBase64Url(iv),
        ciphertext: encodeBase64Url(new Uint8Array(ciphertext)),
        nonce: metadata.nonce,
    };
}

function decodeBase64(value: string): Uint8Array {
    const binary = window.atob(value.replace(/\s/g, ''));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(value: Uint8Array): string {
    let binary = '';
    value.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function buildClientContext(): HostedCheckoutClientContext {
    return {
        timezoneOffset: String(new Date().getTimezoneOffset()),
        language: language.value,
        screen: `${window.screen.width}x${window.screen.height}`,
        challengeWindowSize: 'FULL_SCREEN',
        colorDepth: window.screen.colorDepth,
        javaEnabled: typeof window.navigator.javaEnabled === 'function' && window.navigator.javaEnabled(),
        javaScriptEnabled: true,
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
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
    const brands = (method.brands || []).map(normalizeCode).filter(Boolean);
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
        brands,
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

/** 刷新当前结果后，仅使用页面已允许展示的脱敏字段生成交易回执。 */
async function downloadCurrentReceipt() {
    if (receiptDownloading.value || statusViewState.value === 'blocked') {
        return;
    }
    receiptDownloading.value = true;
    receiptError.value = '';
    try {
        await refreshPaymentStatus();
        const refreshedViewState = String(statusViewState.value);
        if (refreshedViewState === 'blocked') {
            throw new Error('Blocked checkout does not provide a receipt');
        }

        const receiptStatus = refreshedViewState as ReceiptStatus;
        const result = paymentResult.value?.result;
        const paymentDetails = [
            result?.paymentMethod || selectedMethodLabel.value || t('checkout.bankCardLabel'),
            result?.cardBrand,
            result?.cardNumberMasked,
        ]
            .filter(Boolean)
            .join(' / ');
        const rows: ReceiptRow[] = [
            { label: t('status.receiptMerchant'), value: merchantName.value || '-' },
            {
                label: t('status.merchantOrder'),
                value: result?.merchantOrderNo || order.value?.orderNo || '-',
            },
            { label: t('status.paymentMethod'), value: paymentDetails || '-' },
            {
                label: t('status.paymentId'),
                value: result?.transactionId || paymentResult.value?.checkoutAttemptId || '-',
            },
        ];
        if (result?.transactionDateTime) {
            rows.push({
                label: t('status.time'),
                value: formatDateTime(result.transactionDateTime),
            });
        }
        if (receiptStatus === 'success') {
            rows.push({ label: t('status.authorizationCode'), value: result?.authCode || '-' });
        } else if (receiptStatus === 'failed') {
            rows.push({ label: t('status.failureReason'), value: failureReasonText.value });
        } else {
            rows.push({
                label: t('status.receiptCheckoutSession'),
                value: session.value?.checkoutSessionId || '-',
            });
        }

        const orderReference = result?.merchantOrderNo || order.value?.orderNo || 'transaction';
        const safeOrderReference = orderReference.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 48);
        const generatedAt = formatDateTime(new Date().toISOString());
        await downloadReceiptPdf({
            locale: language.value,
            status: receiptStatus,
            brandName: checkoutBrand.name,
            brandSubtitle: checkoutBrand.subtitleEn,
            logoUrl: checkoutBrand.logos.horizontal,
            title: t('status.receiptTitle'),
            statusLabel: localizedStatusConfig.value.title,
            amountLabel: t('status.amount'),
            amount: formattedResultAmount.value,
            rows,
            noticeTitle: t('status.receiptNoticeTitle'),
            notice: t(`status.receiptNotice${receiptStatus[0].toUpperCase()}${receiptStatus.slice(1)}`),
            generatedAtLabel: t('status.receiptGeneratedAt'),
            generatedAt,
            footer: t('status.receiptFooter'),
            fileName: `Vexra-Receipt-${safeOrderReference}-${receiptStatus}.pdf`,
        });
    } catch {
        receiptError.value = t('status.receiptDownloadFailed');
    } finally {
        receiptDownloading.value = false;
    }
}

function startMerchantRedirectCountdown() {
    const action = paymentResult.value?.actions;
    if (!action || !hasMerchantRedirect.value || redirectTimer.value !== null || redirectSubmitted.value) {
        redirectCountdown.value = null;
        return;
    }
    const delaySeconds = Number.isInteger(action.delaySeconds) && action.delaySeconds >= 0
        ? action.delaySeconds
        : 5;
    redirectCountdown.value = delaySeconds;
    if (delaySeconds === 0) {
        submitMerchantReturnForm();
        return;
    }
    redirectTimer.value = window.setInterval(() => {
        const remaining = Math.max(0, (redirectCountdown.value ?? 1) - 1);
        redirectCountdown.value = remaining;
        if (remaining === 0) {
            submitMerchantReturnForm();
        }
    }, 1000);
}

function clearMerchantRedirect(resetSubmission = true) {
    if (redirectTimer.value !== null) {
        window.clearInterval(redirectTimer.value);
        redirectTimer.value = null;
    }
    redirectCountdown.value = null;
    if (resetSubmission) {
        redirectSubmitted.value = false;
    }
}

function resolveMerchantRedirectUrl(): string | null {
    const action = paymentResult.value?.actions;
    if (!action || normalizeCode(action.method) !== 'POST' || !action.formFields) {
        return null;
    }
    try {
        const url = new URL(action.redirectUrl);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
    } catch {
        return null;
    }
}

function submitMerchantReturnForm() {
    if (redirectSubmitted.value) {
        return;
    }
    const action = paymentResult.value?.actions;
    const redirectUrl = resolveMerchantRedirectUrl();
    if (!action || !redirectUrl) {
        clearMerchantRedirect();
        return;
    }
    redirectSubmitted.value = true;
    clearMerchantRedirect(false);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = redirectUrl;
    form.acceptCharset = 'UTF-8';
    form.hidden = true;
    for (const fieldName of MERCHANT_RETURN_FIELD_NAMES) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = fieldName;
        input.value = String(action.formFields[fieldName] ?? '');
        form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
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
            pollingIntervalSeconds: 2,
        },
    };
}

async function mockThreeDsRequiredResult(): Promise<HostedCheckoutPaymentResult> {
    if (!import.meta.env.DEV) {
        throw new Error('Development 3DS fixture is unavailable');
    }
    const { createMockThreeDsRequiredResult } = await import('./dev/mockThreeDs');
    const checkoutSessionId = session.value?.checkoutSessionId || 'CSDEV202607270001';
    return createMockThreeDsRequiredResult(checkoutSessionId);
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
    const transactionId = `TXDEV${Date.now()}`;
    const transactionDateTime = new Date().toISOString();
    const merchantOrderNo = order.value?.orderNo || 'DEV202607270001';
    return {
        checkoutSessionId: session.value?.checkoutSessionId || 'CSDEV202607270001',
        checkoutAttemptId: paymentResult.value?.checkoutAttemptId || 'CADEV202607270001',
        pageState: 'SUCCEEDED',
        result: {
            amount: order.value?.amount || '49.97',
            currency: order.value?.currency || 'USD',
            merchantOrderNo,
            paymentMethod: selectedMethod.value?.label || 'Bank Card',
            cardBrand: 'VISA',
            cardNumberMasked: cardNumber ? `**** ${cardNumber.slice(-4)}` : '**** 1111',
            transactionId,
            transactionDateTime,
            authCode: 'DEV001',
        },
        actions: routeToken.value === 'dev-success-redirect' ? {
            method: 'POST',
            redirectUrl: `${window.location.origin}/dev/merchant-result`,
            delaySeconds: 5,
            formFields: {
                merchantId: '200001',
                orderNo: merchantOrderNo,
                orderId: 'REQ-DEV-001',
                transactionId,
                transactionType: 'PAYMENT',
                transactionStatus: 'SUCCESS',
                transactionDateTime,
                code: 'T200',
                message: 'Success',
            },
        } : undefined,
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
        },
    };
}

function isDevToken(token: string): boolean {
    return import.meta.env.DEV
        && ['dev-token', 'dev-unpaid', 'dev-success', 'dev-success-redirect', 'dev-failed', 'dev-processing', 'dev-3ds', 'dev-3ds-recovery'].includes(token);
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
    clearThreeDsContinuation();
    clearMerchantRedirect();
});
</script>
