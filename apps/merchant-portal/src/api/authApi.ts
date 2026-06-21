import type { AuthLoginResponse, AuthVerifyCodeSendResponse, CommonResult, LoginRequest } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from './http';

export interface MerchantDefaultLoginCredential {
    merchantId?: string | null;
    loginAccount?: string | null;
    password?: string | null;
}

export interface SendLoginVerifyCodeRequest {
    loginAccount: string;
    scene: 'LOGIN';
    merchantId?: string;
}

export async function defaultLoginCredential(): Promise<MerchantDefaultLoginCredential> {
    const result = await http.get<CommonResult<MerchantDefaultLoginCredential>>('/merchant/auth/default-login-credential');
    return unwrapResult(result.data);
}

export async function sendLoginVerifyCode(request: SendLoginVerifyCodeRequest): Promise<AuthVerifyCodeSendResponse> {
    const result = await http.post<CommonResult<AuthVerifyCodeSendResponse>>('/merchant/auth/verify-code/send', request);
    return unwrapResult(result.data);
}

export async function login(request: LoginRequest): Promise<AuthLoginResponse> {
    const result = await http.post<CommonResult<AuthLoginResponse>>('/merchant/auth/login', request);
    return unwrapResult(result.data);
}

export async function currentUser(): Promise<AuthLoginResponse> {
    const result = await http.get<CommonResult<AuthLoginResponse>>('/merchant/auth/me');
    return unwrapResult(result.data);
}

export async function logout(): Promise<void> {
    const result = await http.post<CommonResult<void>>('/merchant/auth/logout');
    return unwrapResult(result.data);
}
