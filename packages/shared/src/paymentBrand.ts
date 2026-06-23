import visaLogo from './assets/payment-icons/cards/visa.svg';
import dinersClubLogo from './assets/payment-icons/cards/diners-club.svg';
import mastercardLogo from './assets/payment-icons/cards/mastercard.svg';
import jcbLogo from './assets/payment-icons/cards/jcb.png';
import maestroLogo from './assets/payment-icons/cards/maestro.svg';
import httpsLogo from './assets/payment-icons/security/https.svg';
import pciDssLogo from './assets/payment-icons/security/pci-dss.svg';
import sslLogo from './assets/payment-icons/security/ssl.svg';
import visaSecureLogo from './assets/payment-icons/security/visa-secure.png';
import alipayPlusLogo from './assets/payment-icons/wallets/alipay-plus.svg';
import applePayLogo from './assets/payment-icons/wallets/apple-pay.svg';
import googlePayLogo from './assets/payment-icons/wallets/google-pay.svg';
import paypalLogo from './assets/payment-icons/wallets/paypal.svg';

export type PaymentLogoKind = 'card-brand' | 'wallet' | 'bank-transfer' | 'security';

export type PaymentLogoKey =
    | 'visa'
    | 'visaSecure'
    | 'mastercard'
    | 'mastercardIdCheck'
    | 'jcb'
    | 'americanExpress'
    | 'dinersClub'
    | 'discover'
    | 'unionPay'
    | 'maestro'
    | 'applePay'
    | 'googlePay'
    | 'samsungPay'
    | 'paypal'
    | 'alipayPlus'
    | 'bankCard'
    | 'digitalWallet'
    | 'spei'
    | 'pix'
    | 'pciDss'
    | 'ssl'
    | 'https';

export interface PaymentLogoConfig {
    key: PaymentLogoKey;
    kind: PaymentLogoKind;
    label: string;
    textFallback: string;
    asset?: string;
    assetSource?: string;
}

export const PAYMENT_LOGO_REGISTRY: Record<PaymentLogoKey, PaymentLogoConfig> = {
    visa: {
        key: 'visa',
        kind: 'card-brand',
        label: 'Visa',
        textFallback: 'Visa',
        asset: visaLogo,
        assetSource: 'Visa Merchant Signage: Visa Brandmark RGB 2021 SVG package',
    },
    visaSecure: {
        key: 'visaSecure',
        kind: 'security',
        label: 'Visa Secure',
        textFallback: 'Visa Secure',
        asset: visaSecureLogo,
        assetSource: 'Visa Merchant Signage: Visa Secure Artwork package',
    },
    mastercard: {
        key: 'mastercard',
        kind: 'card-brand',
        label: 'Mastercard',
        textFallback: 'Mastercard',
        asset: mastercardLogo,
        assetSource: 'Mastercard Brand Center: Mastercard Symbol SVG package provided locally',
    },
    mastercardIdCheck: {
        key: 'mastercardIdCheck',
        kind: 'security',
        label: 'Mastercard ID Check',
        textFallback: 'Mastercard ID Check',
    },
    jcb: {
        key: 'jcb',
        kind: 'card-brand',
        label: 'JCB',
        textFallback: 'JCB',
        asset: jcbLogo,
        assetSource: 'JCB emblem color TIFF package provided locally, converted to PNG for browser display',
    },
    americanExpress: {
        key: 'americanExpress',
        kind: 'card-brand',
        label: 'American Express',
        textFallback: 'American Express',
    },
    dinersClub: {
        key: 'dinersClub',
        kind: 'card-brand',
        label: 'Diners Club International',
        textFallback: 'Diners Club',
        asset: dinersClubLogo,
        assetSource: 'Local payment-icons-svg cards: Diners Club asset provided by user',
    },
    discover: {
        key: 'discover',
        kind: 'card-brand',
        label: 'Discover',
        textFallback: 'Discover',
    },
    unionPay: {
        key: 'unionPay',
        kind: 'card-brand',
        label: 'UnionPay',
        textFallback: 'UnionPay',
    },
    maestro: {
        key: 'maestro',
        kind: 'card-brand',
        label: 'Maestro',
        textFallback: 'Maestro',
        asset: maestroLogo,
        assetSource: 'Mastercard Brand Center: Maestro white/light background SVG package provided locally',
    },
    applePay: {
        key: 'applePay',
        kind: 'wallet',
        label: 'Apple Pay',
        textFallback: 'Apple Pay',
        asset: applePayLogo,
        assetSource: 'Apple Developer: Apple Pay Mark package',
    },
    googlePay: {
        key: 'googlePay',
        kind: 'wallet',
        label: 'Google Pay',
        textFallback: 'Google Pay',
        asset: googlePayLogo,
        assetSource: 'Google Pay API Brand Guidelines: Google Pay Acceptance package',
    },
    samsungPay: {
        key: 'samsungPay',
        kind: 'wallet',
        label: 'Samsung Pay',
        textFallback: 'Samsung Pay',
    },
    paypal: {
        key: 'paypal',
        kind: 'wallet',
        label: 'PayPal',
        textFallback: 'PayPal',
        asset: paypalLogo,
        assetSource: 'PayPal official paypalobjects marketing logo resource',
    },
    alipayPlus: {
        key: 'alipayPlus',
        kind: 'wallet',
        label: 'Alipay+',
        textFallback: 'Alipay+',
        asset: alipayPlusLogo,
        assetSource: 'Alipay+ brand asset package provided locally',
    },
    bankCard: {
        key: 'bankCard',
        kind: 'card-brand',
        label: 'Bank Card',
        textFallback: 'Bank Card',
    },
    digitalWallet: {
        key: 'digitalWallet',
        kind: 'wallet',
        label: 'Digital Wallet',
        textFallback: 'Digital Wallet',
    },
    spei: {
        key: 'spei',
        kind: 'bank-transfer',
        label: 'SPEI',
        textFallback: 'SPEI',
    },
    pix: {
        key: 'pix',
        kind: 'bank-transfer',
        label: 'Pix',
        textFallback: 'Pix',
    },
    pciDss: {
        key: 'pciDss',
        kind: 'security',
        label: 'PCI DSS',
        textFallback: 'PCI DSS Ready',
        asset: pciDssLogo,
        assetSource: 'Local payment-icons-svg security: PCI DSS asset provided by user',
    },
    ssl: {
        key: 'ssl',
        kind: 'security',
        label: 'SSL Encryption',
        textFallback: 'SSL 256-bit',
        asset: sslLogo,
        assetSource: 'Local payment-icons-svg security: SSL asset provided by user',
    },
    https: {
        key: 'https',
        kind: 'security',
        label: 'HTTPS Secure',
        textFallback: 'HTTPS Secure',
        asset: httpsLogo,
        assetSource: 'Local payment-icons-svg security: HTTPS asset provided by user',
    },
};

export const DEFAULT_CARD_BRAND_LOGOS: PaymentLogoKey[] = [
    'visa',
    'mastercard',
    'jcb',
    'maestro',
    'americanExpress',
    'dinersClub',
    'discover',
    'unionPay',
];

export const DEFAULT_WALLET_LOGOS: PaymentLogoKey[] = [
    'applePay',
    'googlePay',
    'samsungPay',
    'paypal',
    'alipayPlus',
];

export const DEFAULT_CHECKOUT_TRUST_LOGOS: PaymentLogoKey[] = [
    'pciDss',
    'ssl',
    'https',
    'visaSecure',
    'mastercardIdCheck',
    'dinersClub',
    'applePay',
    'googlePay',
];

export function getPaymentLogo(key: PaymentLogoKey): PaymentLogoConfig {
    return PAYMENT_LOGO_REGISTRY[key];
}

export function getPaymentLogos(keys: PaymentLogoKey[]): PaymentLogoConfig[] {
    return keys.map((key) => PAYMENT_LOGO_REGISTRY[key]);
}
