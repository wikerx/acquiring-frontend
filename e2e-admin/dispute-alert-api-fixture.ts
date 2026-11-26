import type { Page } from '@playwright/test';
import type {
    AccountInput, AccountProductInput, AlertAccount, AlertMid, AlertPlatform, AlertPlatformProduct,
    BindingDetail, BindingInput, PlatformInput, ProviderAccountInput, SourceOption,
} from '../apps/admin-system/src/api/channel/disputeAlert';
import { isProviderAccountCode } from '../apps/admin-system/src/views/channel/alert-platform/provider-account-fields';

const pathPrefix = '/admin/risk/dispute-alert';
const brand = (product: AlertPlatformProduct['product'], ...cardBrands: string[]): AlertPlatformProduct =>
    ({ product, enabled: true, coverage: cardBrands.length ? 'CONFIRMED' : 'PENDING', cardBrands });
const product = (value: AccountProductInput['product'], status: AccountProductInput['status'] = 'DRAFT'): AccountProductInput =>
    ({ product: value, status, delivery: { transport: 'HTTPS' } });

export async function mockDisputeAlertApi(page: Page) {
    const platforms: AlertPlatform[] = [
        { id: 1, code: 'VERXA_SHIELD', name: 'Verxa Shield', type: 'AGGREGATOR', enabled: true, version: 1, products: [brand('ETHOCA'), brand('RDR', 'VISA')] },
        { id: 2, code: 'AUSTREME', name: 'Austreme', type: 'AGGREGATOR', enabled: true, version: 1, products: [brand('ETHOCA'), brand('RDR', 'VISA')] },
        { id: 3, code: 'NUVEI', name: 'Nuvei', type: 'ACQUIRER_PSP', enabled: true, version: 1, products: [brand('ETHOCA', 'MASTERCARD', 'VISA'), brand('RDR', 'VISA'), brand('AMEX_INQUIRY', 'AMEX')] },
        { id: 4, code: 'CHARGEFLOW', name: 'Chargeflow', type: 'AGGREGATOR', enabled: true, version: 1, products: [brand('ETHOCA'), brand('RDR', 'VISA'), brand('CDRN')] },
        { id: 5, code: 'CHARGEBACKHIT', name: 'Chargebackhit', type: 'AGGREGATOR', enabled: true, version: 1, products: [brand('ETHOCA'), brand('RDR', 'VISA'), brand('CDRN')] },
    ];
    const logos = new Map<number, Buffer>();
    let sequence = 100;
    const newAccount = (id: number, platform: AlertPlatform, input: AccountInput,
        products: AccountProductInput[], registered = false): AlertAccount => ({
        id, platformId: platform.id, platformCode: platform.code, platformName: platform.name,
        merchantNumber: input.merchantNumber, status: input.status, version: 1,
        credentials: { publicKeyRegistered: registered, privateKeyRegistered: registered, version: registered ? 1 : null },
        products: products.map((item) => ({ ...item, id: ++sequence, available: false })),
    });
    const accounts = [
        newAccount(1, platforms[0], { merchantNumber: 'DEMO-MER-01', status: 'ENABLED' },
            [product('ETHOCA', 'ENABLED'), product('RDR', 'ENABLED')], true),
        newAccount(3, platforms[1], { merchantNumber: 'DEMO-SFTP', status: 'DRAFT' },
            [{ ...product('RDR'), delivery: { transport: 'SFTP_PULL', directory: '/demo/rdr' } }]),
        newAccount(4, platforms[2], { merchantNumber: 'DEMO-DMN', status: 'DRAFT' }, [product('ETHOCA')]),
    ];
    const allowedProducts = [['ETHOCA'], ['RDR'], ['ETHOCA', 'RDR'], [], ['ETHOCA']];
    const mids: AlertMid[] = ['MID-DEMO-01', 'MID-DEMO-02', 'MID-DEMO-03', 'MID-DEMO-04', 'MID-DEMO-B01'].map((channelMid, index) =>
        ({ id: index + 1, channelCode: index === 4 ? 'DEMO_CHANNEL_B' : 'SCOTT_CHANNEL_A', channelMid, midName: channelMid }));
    const source = (account: AlertAccount, item: AlertAccount['products'][number]): SourceOption => ({
        accountProductId: item.id, accountId: account.id, platformId: account.platformId, platformName: account.platformName,
        merchantNumber: account.merchantNumber, product: item.product as SourceOption['product'],
    });
    function accountView(row: AlertAccount): AlertAccount {
        const platform = platforms.find(({ id }) => id === row.platformId);
        return {
            ...row, platformName: platform?.name ?? row.platformName,
            products: row.products.map((item) => ({
                ...item, available: Boolean(platform?.enabled && row.status === 'ENABLED' && item.status === 'ENABLED'
                    && (!isProviderAccountCode(row.platformCode) || row.providerConfig?.activationValidated)),
            })),
        };
    }
    function bindingDetail(id: number, input: BindingInput): BindingDetail {
        const account = accounts.find(({ products }) => products.some((item) => item.id === input.accountProductId))!;
        const item = account.products.find(({ id: productId }) => productId === input.accountProductId)!;
        return {
            binding: {
                id, mid: mids.find(({ id: midId }) => midId === input.midConfigId)!, source: source(account, item),
                externalMerchantId: input.externalMerchantId, upstreamMerchantId: input.upstreamMerchantId,
                enrollment: input.enrollment, enrollmentEvidence: input.enrollmentEvidence, status: 'DRAFT',
                sourceAvailable: false, effective: false, version: 1,
                identifierCount: input.identifiers.length, descriptorCount: input.descriptors.length,
            },
            identifiers: input.identifiers, descriptors: input.descriptors, overlappingMids: [],
        };
    }
    const bindings = [
        bindingDetail(1, {
            midConfigId: 1, accountProductId: accounts[0].products[0].id, externalMerchantId: 'DEMO-MER-01',
            upstreamMerchantId: 'DEMO-ETHOCA-01', enrollment: 'CONFIRMED', enrollmentEvidence: 'DEMO-CONFIRMATION',
            identifiers: [], descriptors: [{ value: 'SCOTT*DEMO STORE', enabled: true }],
        }),
        bindingDetail(2, {
            midConfigId: 2, accountProductId: accounts[0].products[1].id, externalMerchantId: 'DEMO-MER-02',
            upstreamMerchantId: 'DEMO-VERIFI-02', enrollment: 'PENDING', enrollmentEvidence: '',
            identifiers: [{ type: 'BIN_CAID', acquirer: 'DEMO-ACQUIRER-A', acquirerBin: '000101', caid: 'DEMO-CAID-01', enabled: true }],
            descriptors: [],
        }),
    ];
    bindings[0].binding.status = 'ENABLED';
    function bindingView(item: BindingDetail): BindingDetail {
        const account = accountView(accounts.find(({ id }) => id === item.binding.source.accountId)!);
        const accountProduct = account.products.find(({ id }) => id === item.binding.source.accountProductId)!;
        return { ...item, binding: {
            ...item.binding, source: source(account, accountProduct), sourceAvailable: accountProduct.available,
            effective: accountProduct.available && item.binding.status === 'ENABLED' && item.binding.enrollment === 'CONFIRMED',
        } };
    }

    await page.route((url) => url.pathname.startsWith(pathPrefix + '/'), async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const [group, idText, action] = url.pathname.slice(pathPrefix.length + 1).split('/');
        const id = Number(idText);
        const method = request.method();
        const ok = (data: unknown) => route.fulfill({ json: { code: 'T200', message: 'SUCCESS', data } });
        const failure = (message: string) => route.fulfill({ json: { code: 'T400', message, data: null } });
        const pageOf = (records: unknown[]) => ({ records, total: records.length });
        if (group === 'platforms' && idText !== 'card-brand-options') {
            const item = platforms.find(({ id: rowId }) => rowId === id);
            if (method === 'GET' && action === 'logo' && logos.has(id)) {
                return route.fulfill({ contentType: 'image/png', body: logos.get(id)! });
            }
            if (method === 'GET') return ok(id ? item : pageOf(platforms));
            let input: PlatformInput;
            let logo: File | null = null;
            let removeLogo = false;
            if (url.pathname.endsWith('/with-logo')) {
                const contentType = request.headerValue('content-type');
                const body = new Response(new Uint8Array(request.postDataBuffer()!), { headers: { 'content-type': await contentType ?? '' } });
                const parts = await body.formData();
                input = JSON.parse(await (parts.get('metadata') as File).text()) as PlatformInput;
                logo = parts.get('file') as File | null;
                removeLogo = parts.get('removeLogo') === 'true';
            } else input = request.postDataJSON() as PlatformInput;
            const saved: AlertPlatform = { ...input, id: item?.id ?? ++sequence, version: (item?.version ?? 0) + 1, logoVersion: item?.logoVersion };
            if (removeLogo) {
                saved.logoVersion = null;
                logos.delete(saved.id);
            } else if (logo?.size) {
                saved.logoVersion = String(++sequence);
                logos.set(saved.id, Buffer.from(await logo.arrayBuffer()));
            }
            if (item) Object.assign(item, saved);
            else platforms.push(saved);
            return ok(saved);
        }
        if (group === 'accounts') {
            const item = accounts.find(({ id: rowId }) => rowId === id);
            if (method === 'GET') {
                if (item) return ok(accountView(item));
                const platformId = Number(url.searchParams.get('platformId'));
                const keyword = url.searchParams.get('keyword')?.toLowerCase();
                const filterProduct = url.searchParams.get('product');
                return ok(pageOf(accounts.filter((account) => (!platformId || account.platformId === platformId)
                    && (!keyword || account.merchantNumber.toLowerCase().includes(keyword))
                    && (!filterProduct || account.products.some(({ product: value }) => value === filterProduct))).map(accountView)));
            }
            if (idText === 'provider' || action === 'provider') {
                const input = request.postDataJSON() as ProviderAccountInput & { platformId?: number; version?: number };
                if (method === 'PUT' && (!item || item.version !== input.version)) return failure('配置已更新，请刷新后重试');
                const platform = platforms.find(({ id: platformId }) => platformId === (item?.platformId ?? input.platformId))!;
                if (accounts.some((account) => account.id !== id && account.platformId === platform.id
                    && account.merchantNumber === input.merchantNumber)) return failure('此平台已有相同的上游账号');
                const products = input.products.map((entry) => {
                    const previous = item?.products.find(({ product }) => product === entry.product);
                    return { ...entry, id: previous?.id ?? ++sequence, delivery: previous?.delivery ?? { transport: 'HTTPS' as const }, available: false };
                });
                const updated = item ?? newAccount(++sequence, platform, input, []);
                updated.merchantNumber = input.merchantNumber;
                updated.status = input.status;
                updated.products = products;
                if (item) updated.version++;
                const registered = new Set(updated.providerConfig?.registered);
                for (const [key, value] of Object.entries(input.credentials ?? {})) {
                    if (value.trim()) registered.add(key);
                }
                updated.providerConfig = { values: input.settings, registered: [...registered], activationValidated: input.status === 'ENABLED' };
                if (!item) accounts.push(updated);
                return ok(accountView(updated));
            }
            const input = request.postDataJSON();
            if (method === 'POST') {
                if (accounts.some((account) => account.platformId === input.platformId && account.merchantNumber === input.merchantNumber)) {
                    return failure('此平台已有相同的上游账号');
                }
                const saved = newAccount(++sequence, platforms.find(({ id: platformId }) => platformId === input.platformId)!,
                    input, input.products);
                accounts.push(saved);
                return ok(accountView(saved));
            }
            if (!item || item.version !== input.version) return failure('配置已更新，请刷新后重试');
            item.version++;
            if (action === 'credentials') {
                item.credentials = { publicKeyRegistered: true, privateKeyRegistered: true, version: (item.credentials.version || 0) + 1 };
                return ok(item.credentials);
            }
            if (action === 'products') {
                const selected = url.pathname.split('/').at(-1) as AccountProductInput['product'];
                const previous = item.products.find(({ product: value }) => value === selected);
                if (previous) Object.assign(previous, { status: input.status, delivery: input.delivery ?? previous.delivery });
                else item.products.push({ id: ++sequence, product: selected, status: input.status, delivery: input.delivery, available: false });
            } else {
                item.status = input.status;
                item.merchantNumber = input.merchantNumber;
            }
            return ok(accountView(item));
        }
        if (group === 'mids') {
            if (idText === 'channels') return ok([...new Set(mids.map(({ channelCode }) => channelCode))]);
            const channel = url.searchParams.get('channelCode');
            const keyword = url.searchParams.get('keyword')?.toLowerCase();
            return ok(mids.filter((mid) => (!channel || mid.channelCode === channel)
                && (!keyword || [mid.channelMid, mid.channelCode, mid.midName].some((text) => text.toLowerCase().includes(keyword)))));
        }
        if (group === 'source-options') {
            const mid = Number(url.searchParams.get('midConfigId'));
            const filterProduct = url.searchParams.get('product') ?? '';
            return ok(!allowedProducts[mid - 1]?.includes(filterProduct) ? [] : accounts.map(accountView).flatMap((account) =>
                account.products.filter((item) => item.available && item.product === filterProduct).map((item) => source(account, item))));
        }
        if (group === 'mid-bindings') {
            const item = bindings.find(({ binding }) => binding.id === id);
            if (method === 'GET') return ok(id ? item && bindingView(item) : pageOf(bindings.map((row) => bindingView(row).binding)));
            const input = request.postDataJSON();
            if (method === 'POST') {
                const saved = bindingDetail(++sequence, input);
                bindings.push(saved);
                return ok(bindingView(saved));
            }
            if (!item || item.binding.version !== input.version) return failure('配置已更新，请刷新后重试');
            if (action === 'status') {
                item.binding.status = input.status;
                item.binding.version++;
            } else {
                const next = bindingDetail(item.binding.id, input);
                next.binding.status = item.binding.status;
                next.binding.version = item.binding.version + 1;
                Object.assign(item, next);
            }
            return ok(bindingView(item));
        }
        return route.fallback();
    });
}
