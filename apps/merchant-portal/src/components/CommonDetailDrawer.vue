<template>
    <el-drawer
        v-model="drawerVisible"
        :title="title"
        :size="drawerSize"
        append-to-body
        destroy-on-close
        :close-on-click-modal="closeOnClickModal"
        class="merchant-detail-drawer"
    >
        <template v-if="$slots.header" #header>
            <slot name="header" />
        </template>
        <div v-loading="loading" class="merchant-detail-drawer__body">
            <slot />
        </div>
        <template #footer>
            <slot name="footer">
                <div class="dialog-footer">
                    <el-button @click="drawerVisible = false">{{ closeText || $t('common.close') }}</el-button>
                </div>
            </slot>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    visible: boolean;
    title: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    loading?: boolean;
    closeText?: string;
    closeOnClickModal?: boolean;
}>(), {
    size: 'md',
    loading: false,
    closeText: '',
    closeOnClickModal: false,
});

const emit = defineEmits<{
    'update:visible': [value: boolean];
}>();

const drawerVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});

const drawerSize = computed(() => {
    const sizeMap = {
        sm: '520px',
        md: '720px',
        lg: '960px',
        xl: '1180px',
        full: '90vw',
    } as const;
    return sizeMap[props.size];
});
</script>

<style scoped>
.merchant-detail-drawer :deep(.el-drawer__header) {
    min-height: 58px;
    margin-bottom: 0;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(20, 184, 166, .16);
}

.merchant-detail-drawer :deep(.el-drawer__title) {
    color: #0f172a;
    font-size: 16px;
    font-weight: 650;
}

.merchant-detail-drawer :deep(.el-drawer__body) {
    overflow: auto;
    padding: 20px 24px;
    background: linear-gradient(180deg, rgba(240, 253, 250, .55), #fff 180px);
}

.merchant-detail-drawer :deep(.el-drawer__footer) {
    padding: 12px 24px 18px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: #fff;
}

.merchant-detail-drawer__body {
    min-height: 120px;
}

@media (max-width: 768px) {
    .merchant-detail-drawer :deep(.el-drawer) {
        width: 100vw !important;
    }
}
</style>
