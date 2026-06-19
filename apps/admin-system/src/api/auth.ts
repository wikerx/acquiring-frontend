import type { AuthLoginResponse, CommonResult, LoginRequest } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from './http';

export interface SendLoginVerifyCodeRequest {
    loginAccount: string;
    scene: 'LOGIN';
    merchantId?: string;
}

export interface SendLoginVerifyCodeResponse {
    verifyCodeId: string;
    receiverType: 'SMS' | 'EMAIL' | 'TOTP';
    maskedReceiver: string;
    expireSeconds: number;
    devCode?: string;
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
): Promise<SendLoginVerifyCodeResponse> {
    const result = await http.post<CommonResult<SendLoginVerifyCodeResponse>>(
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

export async function getUserInfoApi(): Promise<AuthLoginResponse> {
    const result = await http.get<CommonResult<AuthLoginResponse>>(
        '/admin/auth/me',
    );
    return unwrapResult(result.data);
}

export async function logoutApi(): Promise<void> {
    const result = await http.post<CommonResult<void>>(
        '/admin/auth/logout',
    );
    return unwrapResult(result.data);
}
