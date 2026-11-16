import visaLogo from './assets/payment-icons/normalized/visa.png';
import americanExpressLogo from './assets/payment-icons/normalized/american-express.png';
import dinersClubLogo from './assets/payment-icons/normalized/diners-club.png';
import discoverLogo from './assets/payment-icons/normalized/discover.png';
import mastercardLogo from './assets/payment-icons/normalized/mastercard.png';
import jcbLogo from './assets/payment-icons/normalized/jcb.png';
import maestroLogo from './assets/payment-icons/normalized/maestro.png';
import unionPayLogo from './assets/payment-icons/normalized/union-pay.png';
import httpsLogo from './assets/payment-icons/security/https.svg';
import pciDssLogo from './assets/payment-icons/security/pci-dss.svg';
import sslLogo from './assets/payment-icons/security/ssl.svg';
import visaSecureLogo from './assets/payment-icons/security/visa-secure.png';
import alipayPlusLogo from './assets/payment-icons/normalized/alipay-plus.png';
import applePayLogo from './assets/payment-icons/normalized/apple-pay.png';
import cashAppPayLogo from './assets/payment-icons/normalized/cash-app-pay.png';
import googlePayLogo from './assets/payment-icons/normalized/google-pay.png';
import paypalLogo from './assets/payment-icons/normalized/paypal.png';
import bitcoinLogo from './assets/payment-icons/normalized/bitcoin.png';
import achDebitLogo from './assets/payment-icons/normalized/ach-debit.png';
import bankTransferLogo from './assets/payment-icons/normalized/bank-transfer.png';
import pyusdLogo from './assets/payment-icons/normalized/pyusd.png';
import upiLogo from './assets/payment-icons/normalized/upi.png';

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
    | 'cashAppPay'
    | 'bitcoin'
    | 'pyusd'
    | 'achDebit'
    | 'bankTransfer'
    | 'upi'
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
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
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
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
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
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    americanExpress: {
        key: 'americanExpress',
        kind: 'card-brand',
        label: 'American Express',
        textFallback: 'American Express',
        asset: americanExpressLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    dinersClub: {
        key: 'dinersClub',
        kind: 'card-brand',
        label: 'Diners Club International',
        textFallback: 'Diners Club',
        asset: dinersClubLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    discover: {
        key: 'discover',
        kind: 'card-brand',
        label: 'Discover',
        textFallback: 'Discover',
        asset: discoverLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    unionPay: {
        key: 'unionPay',
        kind: 'card-brand',
        label: 'UnionPay',
        textFallback: 'UnionPay',
        asset: unionPayLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    maestro: {
        key: 'maestro',
        kind: 'card-brand',
        label: 'Maestro',
        textFallback: 'Maestro',
        asset: maestroLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    applePay: {
        key: 'applePay',
        kind: 'wallet',
        label: 'Apple Pay',
        textFallback: 'Apple Pay',
        asset: applePayLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    googlePay: {
        key: 'googlePay',
        kind: 'wallet',
        label: 'Google Pay',
        textFallback: 'Google Pay',
        asset: googlePayLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
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
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    alipayPlus: {
        key: 'alipayPlus',
        kind: 'wallet',
        label: 'Alipay+',
        textFallback: 'Alipay+',
        asset: alipayPlusLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
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
    cashAppPay: {
        key: 'cashAppPay',
        kind: 'wallet',
        label: 'Cash App Pay',
        textFallback: 'Cash App Pay',
        asset: cashAppPayLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    bitcoin: {
        key: 'bitcoin',
        kind: 'wallet',
        label: 'Bitcoin',
        textFallback: 'Bitcoin',
        asset: bitcoinLogo,
        assetSource: 'User-provided V5 payment asset normalized to a transparent 128x64 canvas',
    },
    pyusd: {
        key: 'pyusd',
        kind: 'wallet',
        label: 'PayPal USD (PYUSD)',
        textFallback: 'PYUSD',
        asset: pyusdLogo,
        assetSource: 'User-provided PYUSD asset normalized to a transparent 128x64 canvas',
    },
    achDebit: {
        key: 'achDebit',
        kind: 'bank-transfer',
        label: 'ACH Debit',
        textFallback: 'ACH Debit',
        asset: achDebitLogo,
        assetSource: 'User-provided ACH asset normalized to a transparent 128x64 canvas',
    },
    bankTransfer: {
        key: 'bankTransfer',
        kind: 'bank-transfer',
        label: 'Bank Transfer',
        textFallback: 'Bank Transfer',
        asset: bankTransferLogo,
        assetSource: 'User-provided bank transfer asset normalized to a transparent 128x64 canvas',
    },
    upi: {
        key: 'upi',
        kind: 'bank-transfer',
        label: 'Unified Payments Interface (UPI)',
        textFallback: 'UPI',
        asset: upiLogo,
        assetSource: 'User-provided UPI asset normalized to a transparent 128x64 canvas',
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

const PAYMENT_METHOD_LOGO_KEYS: Record<string, PaymentLogoKey[]> = {
    BANK_CARD: ['visa', 'mastercard', 'jcb', 'americanExpress'],
    PAYPAL: ['paypal'],
    APPLE_PAY: ['applePay'],
    GOOGLE_PAY: ['googlePay'],
    ALIPAY_PLUS: ['alipayPlus'],
    CASH_APP_PAY: ['cashAppPay'],
    BTC_ON_CHAIN: ['bitcoin'],
    PYUSD: ['pyusd'],
    ACH_DEBIT: ['achDebit'],
    BANK_TRANSFER: ['bankTransfer'],
    UPI: ['upi'],
    SPEI: ['spei'],
    PIX: ['pix'],
};

const PAYMENT_BRAND_LOGO_KEYS: Record<string, PaymentLogoKey[]> = {
    VISA: ['visa'],
    MASTERCARD: ['mastercard'],
    JCB: ['jcb'],
    MAESTRO: ['maestro'],
    AMEX: ['americanExpress'],
    AMERICAN_EXPRESS: ['americanExpress'],
    DINERS_CLUB: ['dinersClub'],
    DISCOVER: ['discover'],
    UNIONPAY: ['unionPay'],
    PAYPAL: ['paypal'],
    APPLE_PAY: ['applePay'],
    GOOGLE_PAY: ['googlePay'],
    ALIPAY_PLUS: ['alipayPlus'],
    CASH_APP_PAY: ['cashAppPay'],
    BTC_ON_CHAIN: ['bitcoin'],
    PYUSD: ['pyusd'],
    ACH_DEBIT: ['achDebit'],
    BANK_TRANSFER: ['bankTransfer'],
    UPI: ['upi'],
    SPEI: ['spei'],
    PIX: ['pix'],
};

/** 按支付品牌优先、支付方式兜底解析统一 Logo，供筛选项和统计维度复用。 */
export function resolvePaymentLogoKeys(paymentMethod?: string, paymentBrand?: string): PaymentLogoKey[] {
    const brandKeys = PAYMENT_BRAND_LOGO_KEYS[(paymentBrand || '').toUpperCase()] || [];
    const methodKeys = PAYMENT_METHOD_LOGO_KEYS[(paymentMethod || '').toUpperCase()] || [];
    return (brandKeys.length ? brandKeys : methodKeys).filter((key, index, keys) => keys.indexOf(key) === index);
}

export function getPaymentLogo(key: PaymentLogoKey): PaymentLogoConfig {
    return PAYMENT_LOGO_REGISTRY[key];
}

export function getPaymentLogos(keys: PaymentLogoKey[]): PaymentLogoConfig[] {
    return keys.map((key) => PAYMENT_LOGO_REGISTRY[key]);
}
