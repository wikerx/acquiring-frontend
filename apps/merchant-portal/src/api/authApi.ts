import type { AuthLoginResponse, CommonResult, LoginRequest } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from './http';

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
