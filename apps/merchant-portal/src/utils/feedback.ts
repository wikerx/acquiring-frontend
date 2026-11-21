import { nextTick, shallowRef } from 'vue';
import type { ElMessageBoxOptions } from 'element-plus';

interface FeedbackRequest {
    message: ElMessageBoxOptions['message'];
    title: ElMessageBoxOptions['title'];
    options: ElMessageBoxOptions;
    prompt: boolean;
    resolve: (value: { value: string; action: 'confirm' }) => void;
    reject: (reason: 'cancel') => void;
}

// 商户应用内共享确认入口。复用 BaseFeedbackDialog 的焦点管理和真实 DOM 主次顺序。
export const activeFeedback = shallowRef<FeedbackRequest | null>(null);
const queue: FeedbackRequest[] = [];
let settling = false;

function activateNext() {
    if (!settling && !activeFeedback.value && queue.length) activeFeedback.value = queue.shift()!;
}

function open(message: FeedbackRequest['message'], title: FeedbackRequest['title'], options: ElMessageBoxOptions = {}, prompt = false) {
    return new Promise<{ value: string; action: 'confirm' }>((resolve, reject) => {
        queue.push({ message, title, options, prompt, resolve, reject });
        activateNext();
    });
}

export function finishFeedback(confirmed: boolean, value = '') {
    const request = activeFeedback.value;
    if (!request) return;
    settling = true;
    activeFeedback.value = null;
    if (confirmed) request.resolve({ value, action: 'confirm' });
    else request.reject('cancel');
    // 等待旧弹窗卸载，避免复用模型和焦点。
    void nextTick(() => { settling = false; activateNext(); });
}

export const MerchantMessageBox = {
    confirm: (message: FeedbackRequest['message'], title: FeedbackRequest['title'], options?: ElMessageBoxOptions) => open(message, title, options),
    prompt: (message: FeedbackRequest['message'], title: FeedbackRequest['title'], options?: ElMessageBoxOptions) => open(message, title, options, true),
};
