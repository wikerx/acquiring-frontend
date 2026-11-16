import legacyVisaLogo from './assets/payment-icons/cards/visa.svg';
import legacyAmericanExpressLogo from './assets/payment-icons/cards/american-express.svg';
import legacyDinersClubLogo from './assets/payment-icons/cards/diners-club.svg';
import legacyDiscoverLogo from './assets/payment-icons/cards/discover.svg';
import legacyMastercardLogo from './assets/payment-icons/cards/mastercard.svg';
import legacyJcbLogo from './assets/payment-icons/cards/jcb.png';
import legacyMaestroLogo from './assets/payment-icons/cards/maestro.svg';
import legacyUnionPayLogo from './assets/payment-icons/cards/union-pay.svg';
import legacyAlipayPlusLogo from './assets/payment-icons/wallets/alipay-plus.svg';
import legacyApplePayLogo from './assets/payment-icons/wallets/apple-pay.svg';
import legacyCashAppPayLogo from './assets/payment-icons/wallets/cash-app-pay.png';
import legacyGooglePayLogo from './assets/payment-icons/wallets/google-pay.svg';
import legacyPaypalLogo from './assets/payment-icons/wallets/paypal.svg';
import legacyBitcoinLogo from './assets/payment-icons/wallets/bitcoin.svg';
import {
    getPaymentLogo,
    type PaymentLogoConfig,
    type PaymentLogoKey,
} from './paymentBrand';

const LEGACY_PAYMENT_LOGO_ASSETS: Partial<Record<PaymentLogoKey, string>> = {
    visa: legacyVisaLogo,
    mastercard: legacyMastercardLogo,
    jcb: legacyJcbLogo,
    americanExpress: legacyAmericanExpressLogo,
    dinersClub: legacyDinersClubLogo,
    discover: legacyDiscoverLogo,
    unionPay: legacyUnionPayLogo,
    maestro: legacyMaestroLogo,
    applePay: legacyApplePayLogo,
    googlePay: legacyGooglePayLogo,
    paypal: legacyPaypalLogo,
    alipayPlus: legacyAlipayPlusLogo,
    cashAppPay: legacyCashAppPayLogo,
    bitcoin: legacyBitcoinLogo,
};

export function getLegacyPaymentLogos(keys: PaymentLogoKey[]): PaymentLogoConfig[] {
    return keys.map((key) => {
        const logo = getPaymentLogo(key);
        const asset = LEGACY_PAYMENT_LOGO_ASSETS[key];
        return asset ? { ...logo, asset } : logo;
    });
}
