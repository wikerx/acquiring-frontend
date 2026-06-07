import type { AuthLoginResponse, CommonResult, LoginRequest } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

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
    const result = await request.post<CommonResult<SendLoginVerifyCodeResponse>>(
        '/admin/auth/verify-code/send',
        params,
    ) as unknown as CommonResult<SendLoginVerifyCodeResponse>;
    return unwrapResult(result);
}

export async function loginApi(params: LoginParams): Promise<AuthLoginResponse> {
    const requestBody: LoginRequest = {
        loginAccount: params.loginAccount,
        password: params.password,
        verifyCodeId: params.verifyCodeId,
        verifyCode: params.verifyCode,
    };
    const result = await request.post<CommonResult<AuthLoginResponse>>(
        '/admin/auth/login',
        requestBody,
    ) as unknown as CommonResult<AuthLoginResponse>;
    return unwrapResult(result);
}

export async function getUserInfoApi(): Promise<AuthLoginResponse> {
    const result = await request.get<CommonResult<AuthLoginResponse>>(
        '/admin/auth/me',
    ) as unknown as CommonResult<AuthLoginResponse>;
    return unwrapResult(result);
}

export async function logoutApi() {
    const result = await request.post<CommonResult<void>>(
        '/admin/auth/logout',
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}
