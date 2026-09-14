<template>
    <div class="monitor-chart-grid-container">
        <div
            class="monitor-chart-grid"
            :class="`is-${definition.layout}`"
            :data-monitor-page-definition="pageDefinitionId"
        >
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
/** 按集中页面定义提供稳定响应式网格，拒绝页面自行选择图表排列。 */
import { computed } from 'vue';
import { getMonitorPageDefinition } from './monitorPageDefinitions';
import type { MonitorPageDefinitionId } from './monitorTypes';

const props = defineProps<{ pageDefinitionId: MonitorPageDefinitionId }>();
const definition = computed(() => getMonitorPageDefinition(props.pageDefinitionId));
</script>

<style scoped>
.monitor-chart-grid-container {
    container-type: inline-size;
    min-width: 0;
}

.monitor-chart-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    min-width: 0;
}

.monitor-chart-grid.is-single { grid-template-columns: minmax(0, 1fr); }

@container (max-width: 879px) {
    .monitor-chart-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
