import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { layoutPreferenceStorage } from '@/utils/preference';

const DEFAULT_WIDTH = 216;
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;

function clampWidth(width: number) {
    return Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH);
}

export function useResizableSidebar(userKey: Ref<string | number | undefined>) {
    const sidebarWidth = ref(DEFAULT_WIDTH);
    const isSidebarResizing = ref(false);

    let removeListeners: (() => void) | undefined;

    watch(
        userKey,
        (value) => {
            sidebarWidth.value = layoutPreferenceStorage.readSidebarWidth(value, DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH);
        },
        { immediate: true },
    );

    const layoutStyle = computed(() => ({
        '--app-sidebar-width': `${sidebarWidth.value}px`,
    }));

    function stopResize() {
        if (!isSidebarResizing.value) {
            return;
        }
        isSidebarResizing.value = false;
        layoutPreferenceStorage.writeSidebarWidth(userKey.value, sidebarWidth.value);
        removeListeners?.();
        removeListeners = undefined;
    }

    function startSidebarResize(event: MouseEvent) {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();
        isSidebarResizing.value = true;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            sidebarWidth.value = clampWidth(moveEvent.clientX);
        };
        const handleMouseUp = () => stopResize();

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        removeListeners?.();
        removeListeners = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }

    onBeforeUnmount(() => {
        removeListeners?.();
    });

    return {
        sidebarWidth,
        isSidebarResizing,
        layoutStyle,
        startSidebarResize,
    };
}
