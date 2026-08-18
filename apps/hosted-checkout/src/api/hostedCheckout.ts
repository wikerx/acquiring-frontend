import axios from 'axios';
import type { CommonResult } from '@acquiring/shared';

export type CheckoutPageState =
    | 'PAYABLE'
    | 'THREE_DS_REQUIRED'
    | 'PROCESSING'
    | 'SUCCEEDED'
    | 'FAILED_RETRYABLE'
    | 'FAILED_FINAL'
    | 'EXPIRED'
    | 'CANCELLED'
    | 'BLOCKED';

export interface HostedCheckoutClientContext {
    timezoneOffset?: string;
    language?: string;
    screen?: string;
    challengeWindowSize?: string;
    colorDepth?: number;
    javaEnabled?: boolean;
    javaScriptEnabled?: boolean;
    screenHeight?: number;
    screenWidth?: number;
    deviceId?: string;
}

export interface HostedCheckoutSession {
    checkoutSessionId: string;
    pageState: CheckoutPageState | string;
    merchant?: {
        displayName?: string;
        logoUrl?: string;
    };
    order?: {
        orderNo?: string;
        subject?: string;
        description?: string;
        amount?: number | string;
        currency?: string;
        currencyExponent?: number;
        itemsJson?: string;
    };
    paymentMethods?: HostedCheckoutPaymentMethod[];
    checkout?: {
        expireTime?: string;
        retryAllowed?: boolean;
        pollingIntervalSeconds?: number;
    };
    payerInfo?: HostedCheckoutPrefillInfo;
    billingInfo?: HostedCheckoutPrefillInfo;
    paymentResult?: HostedCheckoutPaymentResult;
    cardEncryption?: HostedCheckoutCardEncryption;
}

export interface HostedCheckoutCardEncryption {
    algorithm: 'RSA-OAEP-256+A256GCM' | string;
    keyId: string;
    publicKey: string;
    nonce: string;
}

export interface HostedCheckoutPrefillInfo {
    payerId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    postal?: string;
}

export interface HostedCheckoutPaymentMethod {
    paymentMethod: string;
    channelCode?: string;
    brands?: string[];
    threeDsMode?: string;
}

export interface HostedCheckoutCardBinResult {
    cardBrand?: string;
    recognized: boolean;
    supported: boolean;
}

export interface HostedCheckoutPaymentResult {
    checkoutSessionId: string;
    checkoutAttemptId?: string;
    pageState: CheckoutPageState | string;
    result?: {
        amount?: number | string;
        currency?: string;
        merchantOrderNo?: string;
        paymentMethod?: string;
        cardBrand?: string;
        cardNumberMasked?: string;
        transactionId?: string;
        transactionDateTime?: string;
        authCode?: string;
    };
    threeDsAction?: {
        actionType?: 'HTML' | 'REDIRECT' | string;
        phase?: 'INITIALIZE' | 'AUTHENTICATE' | 'VERIFY' | string;
        html?: string;
        returnUrl?: string;
        timeoutSeconds?: number;
        cardEncryption?: HostedCheckoutCardEncryption;
    };
    failure?: {
        reasonCode?: string;
        message?: string;
        retryAllowed?: boolean;
    };
    polling?: {
        statusUrl?: string;
        intervalSeconds?: number;
        maxIntervalSeconds?: number;
    };
    actions?: {
        method: 'POST' | string;
        redirectUrl: string;
        delaySeconds: number;
        formFields: HostedCheckoutMerchantReturnFormFields;
    };
}

export interface HostedCheckoutMerchantReturnFormFields {
    merchantId: string;
    orderNo: string;
    orderId: string;
    transactionId: string;
    transactionType: string;
    transactionStatus: string;
    transactionDateTime: string;
    code: string;
    message: string;
}

export interface PaymentSubmitPayload {
    opaqueToken: string;
    checkoutSessionId: string;
    attemptRequestId: string;
    paymentMethod: string;
    cardDataEnvelope: HostedCheckoutCardDataEnvelope;
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
    clientContext: HostedCheckoutClientContext;
}

export interface HostedCheckoutCardDataEnvelope {
    algorithm: string;
    keyId: string;
    encryptedKey: string;
    iv: string;
    ciphertext: string;
    nonce: string;
}

/** 收银台接口失败只保留稳定错误码，后端诊断消息不得直接展示给付款人。 */
export class CheckoutApiError extends Error {
    readonly code: string;

    constructor(code: string) {
        super('Checkout request failed');
        this.name = 'CheckoutApiError';
        this.code = code || 'UNKNOWN';
    }
}

export async function queryCheckoutSession(payload: {
    opaqueToken: string;
    cover?: string;
    clientContext: HostedCheckoutClientContext;
}): Promise<HostedCheckoutSession> {
    return postCheckout<HostedCheckoutSession>('/checkout/api/v1/session/query', payload);
}

export async function submitCheckoutPayment(payload: PaymentSubmitPayload): Promise<HostedCheckoutPaymentResult> {
    return postCheckout<HostedCheckoutPaymentResult>('/checkout/api/v1/payment/submit', payload);
}

export async function resolveCheckoutCardBin(payload: {
    opaqueToken: string;
    checkoutSessionId: string;
    cardBin: string;
}): Promise<HostedCheckoutCardBinResult> {
    return postCheckout<HostedCheckoutCardBinResult>('/checkout/api/v1/card-bin/resolve', payload);
}

export async function queryCheckoutPaymentStatus(payload: {
    opaqueToken: string;
    checkoutSessionId: string;
    checkoutAttemptId?: string;
    clientContext: HostedCheckoutClientContext;
}): Promise<HostedCheckoutPaymentResult> {
    return postCheckout<HostedCheckoutPaymentResult>('/checkout/api/v1/payment/status', payload);
}

export async function returnCheckoutThreeDs(payload: {
    threeDsReturnToken: string;
    checkoutSessionId: string;
    checkoutAttemptId: string;
    authenticationData?: string;
    cardDataEnvelope: HostedCheckoutCardDataEnvelope;
    billingCardHolderInfo: PaymentSubmitPayload['billingCardHolderInfo'];
    clientContext: HostedCheckoutClientContext;
}): Promise<HostedCheckoutPaymentResult> {
    return postCheckout<HostedCheckoutPaymentResult>('/checkout/api/v1/3ds/return', payload);
}

async function postCheckout<T>(url: string, payload: unknown): Promise<T> {
    const result = await axios.post<CommonResult<T>>(url, payload, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (result.data.code !== 'T200' && result.data.code !== 'SUCCESS') {
        throw new CheckoutApiError(result.data.code);
    }
    return result.data.data;
}
