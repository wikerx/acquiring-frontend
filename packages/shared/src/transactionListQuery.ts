import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue';
import type { PageQuery, PageResult } from './index';

function sharePendingQuery<Query, Result>(fetch: (query: Query) => Promise<Result>) {
    const pending = new Map<string, Promise<Result>>();
    return (query: Query) => {
        const key = JSON.stringify(query);
        const existing = pending.get(key);
        if (existing) return existing;
        const request = fetch(query).finally(() => pending.delete(key));
        pending.set(key, request);
        return request;
    };
}

/** 每次查询固定筛选快照，翻页只更新列表；统计失败时可用相同条件单独重试。 */
export function useTransactionListQuery<Query extends PageQuery, Row, Summary>(options: {
    page: Ref<number>;
    pageSize: Ref<number>;
    fetchPage: (query: Query) => Promise<PageResult<Row>>;
    fetchSummary: (query: Query) => Promise<Summary>;
    summaryAfterPage?: boolean;
    onPageError: (error: unknown) => void;
}) {
    const rows = shallowRef<Row[]>([]);
    const total = ref(0);
    const loading = ref(false);
    const summary = shallowRef<Summary>();
    const summaryLoading = ref(false);
    const summaryFailed = ref(false);
    const fetchPage = sharePendingQuery(options.fetchPage);
    const fetchSummary = sharePendingQuery(options.fetchSummary);
    let filters: Query | undefined;
    let requestedPage: [number, number] | undefined;
    let pageVersion = 0;
    let summaryVersion = 0;

    async function loadPage() {
        if (!filters) return;
        const version = ++pageVersion;
        const { page, pageSize } = options;
        requestedPage = [page.value, pageSize.value];
        loading.value = true;
        try {
            const result = await fetchPage({ ...filters, pageNo: page.value, pageSize: pageSize.value });
            if (version !== pageVersion) return;
            rows.value = result.records;
            total.value = result.total;
        } catch (error) {
            if (version !== pageVersion) return;
            rows.value = [];
            total.value = 0;
            options.onPageError(error);
        } finally {
            if (version === pageVersion) loading.value = false;
        }
    }

    async function loadSummary() {
        if (!filters) return;
        const version = ++summaryVersion;
        summaryLoading.value = true;
        summaryFailed.value = false;
        summary.value = undefined;
        try {
            const result = await fetchSummary(filters);
            if (version === summaryVersion) summary.value = result;
        } catch {
            if (version === summaryVersion) summaryFailed.value = true;
        } finally {
            if (version === summaryVersion) summaryLoading.value = false;
        }
    }

    function search(query: Query) {
        filters = { ...query, pageNo: undefined, pageSize: undefined };
        const pageResult = loadPage();
        if (options.summaryAfterPage) {
            // 主单分页计数与统计都会扫描同一范围，先归还分页查询占用的数据库资源。
            const version = ++summaryVersion;
            summaryLoading.value = true;
            summaryFailed.value = false;
            summary.value = undefined;
            void pageResult.then(() => {
                if (version === summaryVersion) return loadSummary();
            });
        } else {
            void loadSummary();
        }
        return pageResult;
    }

    watch([options.page, options.pageSize], ([page, pageSize]) => {
        if (page !== requestedPage?.[0] || pageSize !== requestedPage?.[1]) void loadPage();
    });

    onScopeDispose(() => {
        pageVersion++;
        summaryVersion++;
    });

    return { rows, total, loading, summary, summaryLoading, summaryFailed, search, loadSummary };
}
