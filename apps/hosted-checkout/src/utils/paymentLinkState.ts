import { computed, ref } from 'vue';

export type PaymentLinkErrorKey =
  | ''
  | 'paymentLinkEntry.error'
  | 'paymentLinkEntry.notFound'
  | 'paymentLinkEntry.startError';

/** 错误保留语义，已经显示的错误也随当前语言切换。 */
export function usePaymentLinkError(translate: (key: string) => string) {
  const key = ref<PaymentLinkErrorKey>('');
  return { key, message: computed(() => (key.value ? translate(key.value) : '')) };
}

/** 只调度状态读取；不触发支付，不改变服务端截止时间。 */
export function paymentLinkStatusDelay(
  link: {
    processing: boolean;
    status: string;
    payable: boolean;
    expireTime: string;
    serverTime: string;
  },
  failures: number,
): number | null {
  if (link.processing) return Math.min(30000, 5000 * (1 + failures));
  if (link.status !== 'ACTIVE' || !link.payable) return null;
  const deadline = Date.parse(link.expireTime + '+08:00');
  const serverNow = Date.parse(link.serverTime + '+08:00');
  if (!Number.isFinite(deadline) || !Number.isFinite(serverNow)) return null;
  // 浏览器延时为有符号 32 位整数，30 天超界会变为立即执行并形成请求循环。
  return Math.min(2_147_483_647, Math.max(500, deadline - serverNow + 200));
}
