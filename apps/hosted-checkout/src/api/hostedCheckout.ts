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
        remainingAttemptCount?: number;
        pollingIntervalSeconds?: number;
    };
}

export interface HostedCheckoutPaymentMethod {
    paymentMethod: string;
    channelCode?: string;
    brands?: string[];
    threeDsMode?: string;
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
        html?: string;
        returnUrl?: string;
        timeoutSeconds?: number;
    };
    failure?: {
        reasonCode?: string;
        message?: string;
        retryAllowed?: boolean;
        remainingAttemptCount?: number;
    };
    polling?: {
        statusUrl?: string;
        intervalSeconds?: number;
        maxIntervalSeconds?: number;
    };
    actions?: {
        returnUrl?: string;
        cancelUrl?: string;
    };
}

export interface PaymentSubmitPayload {
    opaqueToken: string;
    checkoutSessionId: string;
    attemptRequestId: string;
    paymentMethod: string;
    cardInfo: {
        cardNo: string;
        expirationMonth: string;
        expirationYear: string;
        securityCode: string;
        cardholderName: string;
    };
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
        throw new Error(result.data.message || 'Checkout request failed');
    }
    return result.data.data;
}
