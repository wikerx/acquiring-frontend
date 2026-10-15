import type {
    AccountActivationCompleteRequest,
    AccountActivationCompleteResponse,
    AuthLoginResponse,
    AuthMfaBindConfirmRequest,
    AuthMfaBindInfoResponse,
    AuthMfaVerifyRequest,
    AuthPasswordChangeRequest,
    AuthProfileUpdateRequest,
    AuthVerifyCodeSendResponse,
    CommonResult,
    EmailVerificationVerifyRequest,
    EmailVerificationVerifyResponse,
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetConfirmResponse,
    PasswordResetEmailVerifyRequest,
    PasswordResetMfaVerifyRequest,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    PasswordResetVerifyResponse,
} from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from './http';

const SKIP_AUTH_CONFIG = { skipAuth: true };

export interface MerchantDefaultLoginCredential {
    merchantId?: string | null;
    loginAccount?: string | null;
    password?: string | null;
}

export interface SendLoginVerifyCodeRequest {
    loginAccount?: string;
    scene: 'LOGIN';
    merchantId?: string;
}

export async function defaultLoginCredential(): Promise<MerchantDefaultLoginCredential> {
    const result = await http.get<CommonResult<MerchantDefaultLoginCredential>>('/merchant/auth/default-login-credential', SKIP_AUTH_CONFIG);
    return unwrapResult(result.data);
}

export async function sendLoginVerifyCode(request: SendLoginVerifyCodeRequest): Promise<AuthVerifyCodeSendResponse> {
    const result = await http.post<CommonResult<AuthVerifyCodeSendResponse>>('/merchant/auth/verify-code/send', request, SKIP_AUTH_CONFIG);
    return unwrapResult(result.data);
}

export async function login(request: LoginRequest): Promise<AuthLoginResponse> {
    const result = await http.post<CommonResult<AuthLoginResponse>>('/merchant/auth/login', request, SKIP_AUTH_CONFIG);
    return unwrapResult(result.data);
}

export async function getMfaBindInfo(loginTicket: string): Promise<AuthMfaBindInfoResponse> {
    const result = await http.get<CommonResult<AuthMfaBindInfoResponse>>('/merchant/auth/mfa/bind-info', {
        params: { loginTicket },
        skipAuth: true,
    });
    return unwrapResult(result.data);
}

export async function confirmMfaBind(request: AuthMfaBindConfirmRequest): Promise<AuthLoginResponse> {
    const result = await http.post<CommonResult<AuthLoginResponse>>('/merchant/auth/mfa/bind-confirm', request, SKIP_AUTH_CONFIG);
    return unwrapResult(result.data);
}

export async function verifyMfa(request: AuthMfaVerifyRequest): Promise<AuthLoginResponse> {
    const result = await http.post<CommonResult<AuthLoginResponse>>('/merchant/auth/mfa/verify', request, SKIP_AUTH_CONFIG);
    return unwrapResult(result.data);
}

export async function currentUser(): Promise<AuthLoginResponse> {
    const result = await http.get<CommonResult<AuthLoginResponse>>('/merchant/auth/me');
    return unwrapResult(result.data);
}

export async function updateProfile(request: AuthProfileUpdateRequest): Promise<AuthLoginResponse> {
    const result = await http.post<CommonResult<AuthLoginResponse>>('/merchant/auth/profile', request);
    return unwrapResult(result.data);
}

export async function changePassword(request: AuthPasswordChangeRequest): Promise<void> {
    const result = await http.post<CommonResult<void>>('/merchant/auth/password/change', request);
    return unwrapResult(result.data);
}

export async function logout(): Promise<void> {
    const result = await http.post<CommonResult<void>>('/merchant/auth/logout');
    return unwrapResult(result.data);
}

export async function requestPasswordReset(
    request: PasswordResetRequest & { merchantId: string },
): Promise<PasswordResetRequestResponse> {
    const result = await http.post<CommonResult<PasswordResetRequestResponse>>(
        '/merchant/auth/password-reset/request', request, SKIP_AUTH_CONFIG,
    );
    return unwrapResult(result.data);
}

export async function verifyPasswordResetEmail(
    request: PasswordResetEmailVerifyRequest,
): Promise<PasswordResetVerifyResponse> {
    const result = await http.post<CommonResult<PasswordResetVerifyResponse>>(
        '/merchant/auth/password-reset/email/verify', request, SKIP_AUTH_CONFIG,
    );
    return unwrapResult(result.data);
}

export async function verifyPasswordResetMfa(
    request: PasswordResetMfaVerifyRequest,
): Promise<PasswordResetVerifyResponse> {
    const result = await http.post<CommonResult<PasswordResetVerifyResponse>>(
        '/merchant/auth/password-reset/mfa/verify', request, SKIP_AUTH_CONFIG,
    );
    return unwrapResult(result.data);
}

export async function confirmPasswordReset(
    request: PasswordResetConfirmRequest,
): Promise<PasswordResetConfirmResponse> {
    const result = await http.post<CommonResult<PasswordResetConfirmResponse>>(
        '/merchant/auth/password-reset/confirm', request, SKIP_AUTH_CONFIG,
    );
    return unwrapResult(result.data);
}

export async function verifyAccountEmail(
    request: EmailVerificationVerifyRequest,
): Promise<EmailVerificationVerifyResponse> {
    const result = await http.post<CommonResult<EmailVerificationVerifyResponse>>(
        '/merchant/auth/email-verification/verify', request, SKIP_AUTH_CONFIG,
    );
    return unwrapResult(result.data);
}

export async function completeAccountActivation(
    request: AccountActivationCompleteRequest,
): Promise<AccountActivationCompleteResponse> {
    const result = await http.post<CommonResult<AccountActivationCompleteResponse>>(
        '/merchant/auth/account-activation/complete', request, SKIP_AUTH_CONFIG,
    );
    return unwrapResult(result.data);
}
