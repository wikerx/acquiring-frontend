import test from 'node:test';
import assert from 'node:assert/strict';
import { createChannelPresentationSource, localizedChannelName } from '../../../apps/admin-system/src/api/channel/channelPresentationSource.ts';

const channel = { id: 10, channelCode: 'MPGS', channelCnName: '测试渠道', channelEnName: 'Test Channel', logoVersion: 'a'.repeat(32) };
test('localized hover name switches immediately and falls back to the other language then code', () => {
    assert.equal(localizedChannelName(channel, 'zh-CN', '-'), '测试渠道');
    assert.equal(localizedChannelName(channel, 'en-US', '-'), 'Test Channel');
    assert.equal(localizedChannelName({ ...channel, channelEnName: '' }, 'en-US', '-'), '测试渠道');
    assert.equal(localizedChannelName({ ...channel, channelCnName: '', channelEnName: '' }, 'zh-CN', '-'), 'MPGS');
    assert.equal(localizedChannelName(null, 'en-US', 'original text'), 'original text');
});
test('same-render references share one bounded lookup, including repeated channels', async () => {
    const calls = [];
    const source = createChannelPresentationSource(async q => { calls.push(q); return [channel]; }, async () => new Blob());
    const results = await Promise.all([source.resolve({ id: 10 }), source.resolve({ id: 10 }), source.resolve({ code: 'mpgs' }), source.resolve({ code: 'missing' })]);
    assert.deepEqual(calls, [{ ids: [10], codes: ['MPGS', 'MISSING'] }]);
    assert.deepEqual(results, [channel, channel, channel, null]);
    await source.resolve({}); assert.equal(calls.length, 1);
});
test('large pages split batches at 100 references instead of one request per row', async () => {
    const calls = [];
    const source = createChannelPresentationSource(async q => { calls.push(q); return []; }, async () => new Blob());
    await Promise.all(Array.from({ length: 245 }, (_, i) => source.resolve({ id: i + 1 })));
    assert.deepEqual(calls.map(q => q.ids.length + q.codes.length), [100, 100, 45]);
});
test('lookup failures permit retries and mutable metadata is never retained', async () => {
    let attempts = 0;
    const source = createChannelPresentationSource(async () => { attempts++; if (attempts === 1) throw new Error('unavailable'); return [{ ...channel, logoVersion: String(attempts) }]; }, async () => new Blob());
    await assert.rejects(source.resolve({ id: 10 }));
    assert.equal((await source.resolve({ id: 10 })).logoVersion, '2');
    assert.equal((await source.resolve({ id: 10 })).logoVersion, '3');
});
test('private images share in-flight reads by channel and version; failures and version changes read again', async () => {
    let reads = 0;
    const source = createChannelPresentationSource(async () => [], async () => { reads++; if (reads === 1) throw new Error('unavailable'); return new Blob(['image'], { type: 'image/png' }); });
    await assert.rejects(source.loadLogo(10, 'v1'));
    const [a, b] = await Promise.all([source.loadLogo(10, 'v1'), source.loadLogo(10, 'v1')]);
    assert.equal(a, b); assert.equal(reads, 2);
    await source.loadLogo(10, 'v2'); assert.equal(reads, 3);
    await source.loadLogo(11, 'v2'); assert.equal(reads, 4);
});
test('image cache is bounded and separate sources do not share authenticated blobs', async () => {
    let reads = 0;
    const load = async () => { reads++; return new Blob(); };
    const first = createChannelPresentationSource(async () => [], load);
    const second = createChannelPresentationSource(async () => [], load);
    for (let id = 1; id <= 33; id++) await first.loadLogo(id, 'v1');
    await first.loadLogo(1, 'v1'); assert.equal(reads, 34);
    await second.loadLogo(1, 'v1'); assert.equal(reads, 35);
});
