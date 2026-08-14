import type { HostedCheckoutPaymentResult } from '../api/hostedCheckout';

export function createMockThreeDsRequiredResult(checkoutSessionId: string): HostedCheckoutPaymentResult {
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
