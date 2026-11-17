import { loadPrivateImageBlob } from '@/utils/download';
import { unwrapResult, type AuthAccount, type CommonResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { createChannelPresentationSource, type ChannelPresentation } from './channelPresentationSource';

export type ChannelPresentationScope = 'INFO' | 'CAPABILITY' | 'LIMIT' | 'MID' | 'MID_BINDING' | 'ROUTE'
    | 'ALERT_RULE' | 'ALERT_EVENT' | 'ORDER' | 'OPERATION';

// 登录主体或权限快照替换后使用新池，禁止跨账号复用私有图片读取结果。
const sources = new WeakMap<AuthAccount, Map<ChannelPresentationScope, ReturnType<typeof createChannelPresentationSource>>>();
export function channelPresentationSource(account: AuthAccount, scope: ChannelPresentationScope) {
    let scopes = sources.get(account);
    if (!scopes) { scopes = new Map(); sources.set(account, scopes); }
    let source = scopes.get(scope);
    if (!source) {
        source = createChannelPresentationSource(async (query) => {
            const result = await http.post<CommonResult<ChannelPresentation[]>>('/admin/channel/presentation/search', query, { params: { scope } });
            return unwrapResult(result.data);
        }, async (id, version) => loadPrivateImageBlob(`/admin/channel/presentation/${id}/logo`, { scope, version }));
        scopes.set(scope, source);
    }
    return source;
}
