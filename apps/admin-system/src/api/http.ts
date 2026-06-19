import { createHttpClient } from '@acquiring/shared';
import { useUserStore } from '@/store';
import { i18n } from '@/i18n';

export const http = createHttpClient(
    import.meta.env.VITE_ADMIN_API_BASE_URL || '',
    () => useUserStore().authSession,
    () => useUserStore().reset(),
    () => String(i18n.global.locale.value || 'zh-CN'),
);
