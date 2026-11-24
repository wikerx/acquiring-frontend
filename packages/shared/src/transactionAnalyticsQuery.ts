import { onScopeDispose, ref } from 'vue';

/** 双端交易分析只应用最后一次查询，同页签同条件的在途请求可以复用。 */
export function useTransactionAnalyticsQuery() {
    const loading = ref(false);
    const failed = ref(false);
    const pending = new Map<string, Promise<() => void>>();
    let latest = 0;

    function invalidate() {
        latest += 1;
        loading.value = false;
        failed.value = false;
    }

    async function run(key: string, load: () => Promise<() => void>) {
        const version = ++latest;
        loading.value = true;
        failed.value = false;
        try {
            let request = pending.get(key);
            if (!request) {
                request = load().finally(() => pending.delete(key));
                pending.set(key, request);
            }
            const apply = await request;
            if (version === latest) apply();
        } catch {
            if (version === latest) failed.value = true;
        } finally {
            if (version === latest) loading.value = false;
        }
    }

    onScopeDispose(invalidate);
    return { loading, failed, run, invalidate };
}
