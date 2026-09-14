<template>
    <div class="monitor-status-grid" role="list">
        <div v-for="item in items" :key="item.key" class="monitor-status-grid__item" role="listitem">
            <span class="monitor-status-grid__dot" :class="`is-${item.status}`" aria-hidden="true" />
            <div class="monitor-status-grid__content">
                <strong>{{ item.label }}</strong>
                <span v-if="item.description">{{ item.description }}</span>
            </div>
            <span class="monitor-status-grid__value">{{ item.value || statusLabel(item.status) }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
/** 展示基础设施依赖状态的紧凑列表，不承载业务操作。 */
import { useI18n } from 'vue-i18n';
import type { MonitorStatusItem } from './monitorTypes';

defineProps<{ items: MonitorStatusItem[] }>();
const { t } = useI18n();

function statusLabel(status: MonitorStatusItem['status']) {
    return t(`monitor.chart.status.${status}`);
}
</script>

<style scoped>
.monitor-status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 20px;
    padding: 4px 0;
}

.monitor-status-grid__item {
    display: grid;
    grid-template-columns: 10px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    border-bottom: 1px solid #EDF1F7;
}

.monitor-status-grid__dot { width: 8px; height: 8px; border-radius: 50%; background: #8A97A8; }
.monitor-status-grid__dot.is-healthy { background: #22A06B; }
.monitor-status-grid__dot.is-warning { background: #F59E0B; }
.monitor-status-grid__dot.is-error { background: #E5484D; }
.monitor-status-grid__content { display: grid; min-width: 0; gap: 2px; }
.monitor-status-grid__content strong { overflow: hidden; color: #1F2937; font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.monitor-status-grid__content span { overflow: hidden; color: #8A97A8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.monitor-status-grid__value { color: #7B8794; font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }

@media (max-width: 760px) {
    .monitor-status-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
