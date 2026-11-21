import { MerchantMessageBox } from '@/utils/feedback';
import { type ElMessageBoxOptions } from 'element-plus';

export async function confirmAction(
    message: ElMessageBoxOptions['message'],
    title: ElMessageBoxOptions['title'],
    options?: ElMessageBoxOptions,
) {
    try {
        await MerchantMessageBox.confirm(message, title, options);
        return true;
    } catch (error) {
        if (error === 'cancel' || error === 'close') {
            return false;
        }
        throw error;
    }
}
