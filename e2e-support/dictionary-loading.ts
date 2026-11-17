import { expect, type Page } from '@playwright/test';

/** 使用应用实际 API 模块验证并发读取、查询隔离和失败后重试，不跳过 HTTP 提交保护。 */
export async function verifyDictionaryLoading(page: Page, app: 'admin' | 'merchant') {
    const requests: Array<Record<string, unknown>> = [];
    let retryRequests = 0;
    await page.route(`**/${app}/system/dicts/data/search`, async (route) => {
        const query = route.request().postDataJSON() as Record<string, unknown>;
        if (!String(query.dictType).startsWith('qa_')) return route.fallback();
        requests.push(query);
        await new Promise((resolve) => setTimeout(resolve, 40));
        if (query.dictType === 'qa_retry' && ++retryRequests === 1) {
            await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'T500' }) });
            return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
            code: 'T200', data: { total: 1, pageNo: query.pageNo, pageSize: query.pageSize, pages: 1,
                records: [{ id: 1, dictType: query.dictType, dictLabel: query.locale === 'en-US' ? 'Payment' : '支付',
                    dictValue: 'PAYMENT', status: query.status, listClass: 'success', extraJson: '{"logoKeys":["visa"]}' }] },
        }) });
    });

    const result = await page.evaluate(async (target) => {
        const module = target === 'admin'
            ? await import('/src/api/system/dict.ts')
            : await import('/src/api/systemApi.ts');
        const read = target === 'admin' ? module.searchDictData : module.systemApi.searchDictData;
        const query = { dictType: 'qa_dictionary', locale: 'zh-CN', status: 1, pageNo: 1, pageSize: 500 };
        const shared = await Promise.all([read(query), read({ ...Object.fromEntries(Object.entries(query).reverse()), dictLabel: undefined })]);
        await read(query);
        const variations = [
            { locale: 'en-US' }, { status: 0 }, { pageNo: 2 }, { pageSize: 200 },
            { dictType: 'qa_other' }, { dictLabel: '指定标签' }, { dictValue: 'PAYMENT' }, { parentValue: 'BANK_CARD' },
        ];
        const isolated = await Promise.all(variations.map((change) => read({ ...query, ...change })));
        const retryQuery = { ...query, dictType: 'qa_retry' };
        const failed = await Promise.allSettled([read(retryQuery), read(retryQuery)]);
        const retried = await read(retryQuery);
        return {
            shared, englishLabel: isolated[0].records[0].dictLabel, failed: failed.map((item) => item.status),
            retried: retried.records[0].dictValue,
        };
    }, app);

    expect(result.shared).toHaveLength(2);
    for (const response of result.shared) {
        expect(response.records[0]).toMatchObject({ dictValue: 'PAYMENT', listClass: 'success', extraJson: '{"logoKeys":["visa"]}' });
    }
    expect(result.englishLabel).toBe('Payment');
    expect(result.failed).toEqual(['rejected', 'rejected']);
    expect(result.retried).toBe('PAYMENT');
    expect(requests.filter((query) => query.dictType === 'qa_dictionary')).toHaveLength(9);
    expect(requests.filter((query) => query.dictType === 'qa_other')).toHaveLength(1);
    expect(requests.filter((query) => query.dictType === 'qa_retry')).toHaveLength(2);
}
