import { onMounted, onUnmounted } from 'vue';

/** 内容放不下时才切换等宽纵排，DOM 顺序始终保持主操作、辅助操作、取消。 */
export function useDialogFooterLayout() {
    let mutation: MutationObserver | undefined;
    let resize: ResizeObserver | undefined;
    let frame = 0;
    const observed = new Set<HTMLElement>();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    function measure() {
        frame = 0;
        document.querySelectorAll<HTMLElement>('.el-dialog .dialog-footer, .el-drawer .dialog-footer').forEach(footer => {
            if (!observed.has(footer)) { observed.add(footer); resize?.observe(footer); }
            const buttons = [...footer.children].filter((item): item is HTMLButtonElement =>
                item instanceof HTMLButtonElement && getComputedStyle(item).display !== 'none');
            const naturalWidth = buttons.reduce((total, button) => {
                const style = getComputedStyle(button);
                if (context) context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                const textWidth = context?.measureText(button.textContent?.trim() || '').width ?? 56;
                const iconWidth = button.querySelector('.el-icon') ? 20 : 0;
                return total + Math.max(88, Math.ceil(textWidth) + 32 + iconWidth);
            }, Math.max(0, buttons.length - 1) * 12);
            footer.classList.toggle('merchant-dialog-footer--stacked', buttons.length > 1 && naturalWidth > footer.clientWidth);
        });
        for (const footer of observed) {
            if (!footer.isConnected) { resize?.unobserve(footer); observed.delete(footer); }
        }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(measure); }
    onMounted(() => {
        resize = new ResizeObserver(schedule);
        mutation = new MutationObserver(schedule);
        mutation.observe(document.body, { childList: true, subtree: true, characterData: true });
        schedule();
    });
    onUnmounted(() => { mutation?.disconnect(); resize?.disconnect(); cancelAnimationFrame(frame); observed.clear(); });
}
