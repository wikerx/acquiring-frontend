<template>
    <div ref="rootRef" class="standard-table-wrapper">
        <el-table
            ref="tableRef"
            v-bind="$attrs"
            border
            :fit="fitColumns"
            :data-standard-table-key="tableKey"
            @header-dragend="handleHeaderDragend"
        >
            <slot />
        </el-table>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
    bindToolbarContext,
    registerStandardTable,
    unbindToolbarContext,
    type StandardTableRegistration,
} from './standardTableRegistry';
import { useAuthStore } from '@/stores/authStore';

defineOptions({
    inheritAttrs: false,
});

const props = defineProps<{
    tableKey: string;
    userKey?: string | number | null;
}>();

type HeaderColumn = { property?: string; id?: string };
type ElementTableInstance = {
    $el?: HTMLElement;
    context?: {
        vnode?: {
            el?: HTMLElement;
        };
        store?: unknown;
    };
};

const tableRef = ref<ElementTableInstance>();
const rootRef = ref<HTMLElement>();
const fitColumns = ref(true);
let registration: StandardTableRegistration | undefined;
let toolbarId = '';
let layoutFrame = 0;
let registrationVersion = 0;

const maxColumnReadyRetry = 8;

function findToolbarId(el: HTMLElement) {
    const container = el.closest('.system-page, .openapi-key-page, .page');
    const toolbars = Array.from(container?.querySelectorAll<HTMLElement>('[data-standard-toolbar-id]') || []);
    return toolbars
        .filter((toolbar) => toolbar.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
        .at(-1)?.dataset.standardToolbarId || '';
}

function cleanup() {
    registrationVersion += 1;
    if (layoutFrame) {
        cancelAnimationFrame(layoutFrame);
        layoutFrame = 0;
    }
    if (toolbarId) {
        unbindToolbarContext(toolbarId, props.tableKey);
        toolbarId = '';
    }
    registration?.dispose();
    registration = undefined;
}

function refreshTableLayout(attempt = 0, version = registrationVersion) {
    if (version !== registrationVersion || !registration) {
        return;
    }
    if (registration.hasColumns()) {
        registration.reloadColumns();
    }
    registration.refreshLayout();
    fitColumns.value = registration.shouldFitContainer();

    if (!registration.hasColumns() && attempt < maxColumnReadyRetry) {
        layoutFrame = requestAnimationFrame(() => refreshTableLayout(attempt + 1, version));
        return;
    }

    layoutFrame = requestAnimationFrame(() => {
        if (version !== registrationVersion || !registration) {
            return;
        }
        registration.refreshLayout();
        fitColumns.value = registration.shouldFitContainer();
    });
}

function register() {
    cleanup();
    const version = registrationVersion;
    nextTick(() => {
        if (version !== registrationVersion) {
            return;
        }
        const table = tableRef.value;
        if (!table) {
            return;
        }
        const auth = useAuthStore();
        const account = auth.session?.account;
        registration = registerStandardTable(props.tableKey, table as never, props.userKey ?? account?.accountId ?? account?.merchantUserId);
        const root = rootRef.value || table.$el || table.context?.vnode?.el;
        toolbarId = root ? findToolbarId(root) : '';
        if (toolbarId) {
            bindToolbarContext(toolbarId, props.tableKey);
        }
        refreshTableLayout(0, version);
    });
}

function handleHeaderDragend(newWidth: number, oldWidth: number, column: HeaderColumn) {
    registration?.handleHeaderDragend(newWidth, oldWidth, column);
    refreshTableLayout();
}

function handleResize() {
    refreshTableLayout();
}

onMounted(() => {
    register();
    window.addEventListener('resize', handleResize);
});
onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    cleanup();
});
watch(() => [props.tableKey, props.userKey], register);
</script>

<style scoped>
.standard-table-wrapper {
    width: 100%;
}
</style>
