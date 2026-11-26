<template>
    <div v-if="coverageVisible" class="fee-authorization-coverage">
        <div v-if="orderedCoverage.length === 1" class="coverage-item">
            <span>{{ orderedCoverage[0].name }}</span>
            <el-tag :type="orderedCoverage[0].tagType" size="small" effect="plain" :title="orderedCoverage[0].status">{{ orderedCoverage[0].status }}</el-tag>
        </div>
        <template v-else-if="orderedCoverage.length">
            <el-tag v-for="status in statusCounts" :key="status.label" :type="status.tagType" size="small" effect="plain">
                {{ t('paymentMethod.fee.statusCount', { status: status.label, count: status.count }) }}
            </el-tag>
            <el-popover
                v-model:visible="expanded"
                trigger="click"
                :width="540"
                :popper-style="{ maxWidth: 'calc(100vw - 24px)' }"
                placement="bottom"
                :title="t('paymentMethod.fee.coverageDetails')"
            >
                <template #reference>
                    <el-button link type="primary" :aria-expanded="expanded" @keydown.esc.stop="expanded = false">{{ t('paymentMethod.fee.more', { count: orderedCoverage.length }) }}</el-button>
                </template>
                <ul class="coverage-popover">
                    <li v-for="item in orderedCoverage" :key="item.itemKey" class="coverage-item">
                        <span class="coverage-item__name">
                            <PaymentLogoMark v-if="item.logoKey" :logo-key="item.logoKey" size="sm" aria-hidden="true" />
                            <span>{{ item.name }}</span>
                        </span>
                        <el-tag :type="item.tagType" size="small" effect="plain" :title="item.status">{{ item.status }}</el-tag>
                    </li>
                </ul>
            </el-popover>
        </template>
        <span v-else class="coverage-muted">{{ t('paymentMethod.fee.noCoverage') }}</span>
    </div>
    <span v-else class="coverage-muted">{{
        t(
            assessmentStatus === 'HISTORY_PENDING'
                ? 'paymentMethod.fee.historyPending'
                : 'paymentMethod.unassessed',
        )
    }}</span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PaymentLogoMark, resolvePaymentLogoKeys } from '@acquiring/shared';
import type { FeePaymentMethodCoverage } from '@/api/financeApi';

const props = defineProps<{
    assessmentStatus?: 'EVALUATED' | 'HISTORY_PENDING' | 'UNAVAILABLE';
    coverage?: FeePaymentMethodCoverage[] | null;
}>();
const { t, te } = useI18n();
const expanded = ref(false);
const coverageVisible = computed(
    () => Array.isArray(props.coverage)
        && (props.assessmentStatus === 'EVALUATED' || props.assessmentStatus === 'HISTORY_PENDING'),
);
const orderedCoverage = computed(() => [...(props.coverage ?? [])]
    .sort((left, right) => Number(right.authorizationStatus === 'ACTIVE') - Number(left.authorizationStatus === 'ACTIVE'))
    .map((item) => {
        const [dimension, code] = item.itemKey.split(':', 2);
        const logoKeys = dimension === 'CARD_BRAND'
            ? resolvePaymentLogoKeys(undefined, code)
            : resolvePaymentLogoKeys(code);
        const key = `paymentMethod.status.${item.authorizationStatus}`;
        return {
            ...item,
            logoKey: logoKeys.length === 1 ? logoKeys[0] : undefined,
            status: te(key) ? t(key) : t('paymentMethod.unassessed'),
            tagType: item.authorizationStatus === 'ACTIVE' ? 'success' as const : 'info' as const,
        };
    }),
);
const statusCounts = computed(() => {
    const counts = new Map<string, { label: string; tagType: 'success' | 'info'; count: number }>();
    for (const item of orderedCoverage.value) {
        const status = counts.get(item.status);
        if (status) status.count += 1;
        else counts.set(item.status, { label: item.status, tagType: item.tagType, count: 1 });
    }
    return [...counts.values()];
});
</script>

<style scoped>
.fee-authorization-coverage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 4px 8px;
    padding: 4px 0;
}
.coverage-popover {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 235px), 1fr));
    gap: 6px;
    max-height: min(45vh, 300px);
    overflow: auto;
    margin: 0;
    padding: 0;
    list-style: none;
}
.coverage-item,
.coverage-item__name {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}
.coverage-item { justify-content: space-between; }
.coverage-popover .coverage-item {
    min-height: 34px;
    padding: 4px 8px;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 6px;
    background: var(--el-fill-color-extra-light);
}
.coverage-item__name { overflow-wrap: anywhere; }
.coverage-item .el-tag {
    flex: none;
    max-width: 55%;
    white-space: nowrap;
}
.coverage-item :deep(.el-tag__content) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}
.coverage-muted { color: var(--el-text-color-secondary); }
</style>
