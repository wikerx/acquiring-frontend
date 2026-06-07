import { createHttpClient } from '@acquiring/shared';
import { useUserStore } from '@/store';

export const http = createHttpClient(
    import.meta.env.VITE_ADMIN_API_BASE_URL || '',
    () => useUserStore().authSession,
    () => useUserStore().reset(),
);
