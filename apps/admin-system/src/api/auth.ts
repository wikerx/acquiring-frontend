import type {
    AuthLoginResponse,
    AuthMfaBindConfirmRequest,
    AuthMfaBindInfoResponse,
    AuthMfaVerifyRequest,
    AuthPasswordChangeRequest,
    AuthProfileUpdateRequest,
    AuthVerifyCodeSendResponse,
    CommonResult,
    LoginRequest,
} from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from './http';

export interface SendLoginVerifyCodeRequest {
    loginAccount?: string;
    scene: 'LOGIN';
    merchantId?: string;
}

export interface LoginParams {
    loginAccount: string;
    password: string;
    verifyCodeId: string;
    verifyCode: string;
    rememberMe?: boolean;
}

export async function sendLoginVerifyCodeApi(
    params: SendLoginVerifyCodeRequest,
): Promise<AuthVerifyCodeSendResponse> {
    const result = await http.post<CommonResult<AuthVerifyCodeSendResponse>>(
        '/admin/auth/verify-code/send',
        params,
    );
    return unwrapResult(result.data);
}

export async function loginApi(params: LoginParams): Promise<AuthLoginResponse> {
    const requestBody: LoginRequest = {
        loginAccount: params.loginAccount,
        password: params.password,
        verifyCodeId: params.verifyCodeId,
        verifyCode: params.verifyCode,
    };
    const result = await http.post<CommonResult<AuthLoginResponse>>(
        '/admin/auth/login',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function getMfaBindInfoApi(loginTicket: string): Promise<AuthMfaBindInfoResponse> {
    const result = await http.get<CommonResult<AuthMfaBindInfoResponse>>(
        '/admin/auth/mfa/bind-info',
        { params: { loginTicket } },
    );
    return unwrapResult(result.data);
}

export async function confirmMfaBindApi(params: AuthMfaBindConfirmRequest): Promise<AuthLoginResponse> {
    const result = await http.post<CommonResult<AuthLoginResponse>>(
        '/admin/auth/mfa/bind-confirm',
        params,
    );
    return unwrapResult(result.data);
}

export async function verifyMfaApi(params: AuthMfaVerifyRequest): Promise<AuthLoginResponse> {
    const result = await http.post<CommonResult<AuthLoginResponse>>(
        '/admin/auth/mfa/verify',
        params,
    );
    return unwrapResult(result.data);
}

export async function getUserInfoApi(): Promise<AuthLoginResponse> {
    const result = await http.get<CommonResult<AuthLoginResponse>>(
        '/admin/auth/me',
    );
    return unwrapResult(result.data);
}

export async function updateProfileApi(params: AuthProfileUpdateRequest): Promise<AuthLoginResponse> {
    const result = await http.post<CommonResult<AuthLoginResponse>>(
        '/admin/auth/profile',
        params,
    );
    return unwrapResult(result.data);
}

export async function changePasswordApi(params: AuthPasswordChangeRequest): Promise<void> {
    const result = await http.post<CommonResult<void>>(
        '/admin/auth/password/change',
        params,
    );
    return unwrapResult(result.data);
}

export async function logoutApi(): Promise<void> {
    const result = await http.post<CommonResult<void>>(
        '/admin/auth/logout',
    );
    return unwrapResult(result.data);
}
