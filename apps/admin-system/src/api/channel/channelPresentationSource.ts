export interface ChannelPresentation {
    id: number;
    channelCode: string;
    channelCnName?: string | null;
    channelEnName?: string | null;
    logoVersion?: string | null;
}
export interface ChannelReference { id?: number; code?: string }
export interface ChannelLookup { ids: number[]; codes: string[] }

export function localizedChannelName(channel: ChannelPresentation | null, locale: string, fallback: string) {
    if (!channel) return fallback;
    const names = locale.toLowerCase().startsWith('zh')
        ? [channel.channelCnName, channel.channelEnName] : [channel.channelEnName, channel.channelCnName];
    return names.find((name) => name?.trim()) || channel.channelCode || fallback;
}

/** 一个登录主体、一个查看范围共用；仅合并在途元数据，不缓存可变的渠道资料。 */
export function createChannelPresentationSource(
    lookup: (query: ChannelLookup) => Promise<ChannelPresentation[]>,
    load: (id: number, version: string) => Promise<Blob>,
) {
    type Pending = { reference: ChannelReference; resolve: (value: ChannelPresentation | null) => void; reject: (error: unknown) => void };
    const pending = new Map<string, Promise<ChannelPresentation | null>>();
    const queue: Pending[] = [];
    const blobs = new Map<string, { expires: number; promise: Promise<Blob> }>();
    const codeKey = (value?: string) => value?.trim().toUpperCase() || '';
    const keyFor = (reference: ChannelReference) => reference.id ? `id:${reference.id}` : `code:${codeKey(reference.code)}`;

    async function flush() {
        const batch = queue.splice(0, 100);
        if (queue.length) queueMicrotask(() => { void flush(); });
        try {
            const rows = await lookup({
                ids: [...new Set(batch.flatMap(({ reference }) => reference.id ? [reference.id] : []))],
                codes: [...new Set(batch.flatMap(({ reference }) => !reference.id && reference.code ? [codeKey(reference.code)] : []))],
            });
            for (const item of batch) {
                const match = rows.find((row) => item.reference.id ? row.id === item.reference.id : codeKey(row.channelCode) === codeKey(item.reference.code));
                pending.delete(keyFor(item.reference));
                item.resolve(match || null);
            }
        } catch (error) {
            for (const item of batch) { pending.delete(keyFor(item.reference)); item.reject(error); }
        }
    }

    return {
        resolve(reference: ChannelReference): Promise<ChannelPresentation | null> {
            if (!reference.id && !codeKey(reference.code)) return Promise.resolve(null);
            const key = keyFor(reference);
            const existing = pending.get(key);
            if (existing) return existing;
            const request = new Promise<ChannelPresentation | null>((resolve, reject) => {
                queue.push({ reference, resolve, reject });
                if (queue.length === 1) queueMicrotask(() => { void flush(); });
            });
            pending.set(key, request);
            return request;
        },
        loadLogo(id: number, version: string): Promise<Blob> {
            const key = `${id}:${version}`;
            const cached = blobs.get(key);
            if (cached && cached.expires > Date.now()) return cached.promise;
            // 只保留有界内存 Blob，不保存对象 URL、令牌或本地存储。失败立即移除以便重试。
            const promise = load(id, version).catch((error: unknown) => {
                if (blobs.get(key)?.promise === promise) blobs.delete(key);
                throw error;
            });
            blobs.delete(key);
            blobs.set(key, { expires: Date.now() + 60000, promise });
            while (blobs.size > 32) blobs.delete(blobs.keys().next().value!);
            return promise;
        },
    };
}
