import { createHttpClient, resolveFriendlyRequestMessage } from '@acquiring/shared';
import { useAuthStore } from '@/stores/authStore';

export const http = createHttpClient(
    import.meta.env.VITE_MERCHANT_API_BASE_URL || '',
    () => useAuthStore().session,
    () => useAuthStore().clearSession(),
    () => document.documentElement.lang || navigator.language || 'zh-CN',
    (error) => resolveFriendlyRequestMessage(error, document.documentElement.lang || navigator.language || 'zh-CN'),
);
