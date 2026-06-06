import type { AuthLoginResponse, CommonResult, LoginRequest } from '@acquiring/shared';
import { http } from './http';

export function login(request: LoginRequest) {
    return http.post<CommonResult<AuthLoginResponse>>('/admin/auth/login', request);
}

export function currentUser() {
    return http.get<CommonResult<AuthLoginResponse>>('/admin/auth/me');
}

export function logout() {
    return http.post<CommonResult<void>>('/admin/auth/logout');
}
