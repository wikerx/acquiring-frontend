<template>
    <section class="monitor-chart-card" :class="`is-${size}`">
        <header class="monitor-chart-card__header">
            <div class="monitor-chart-card__heading">
                <h3>{{ title }}</h3>
                <p v-if="subtitle">{{ subtitle }}</p>
            </div>
            <div v-if="$slots.actions" class="monitor-chart-card__actions">
                <slot name="actions" />
            </div>
        </header>

        <div class="monitor-chart-card__body">
            <el-skeleton v-if="state.status === 'loading'" animated :rows="5" class="monitor-chart-card__skeleton" />

            <div v-else-if="state.status === 'empty'" class="monitor-chart-card__state">
                <DataLine class="monitor-chart-card__state-icon" aria-hidden="true" />
                <strong>{{ t('monitor.chart.emptyTitle') }}</strong>
                <span>{{ state.description || t('monitor.chart.emptyDescription') }}</span>
            </div>

            <div v-else-if="state.status === 'error' && !state.stale" class="monitor-chart-card__state is-error">
                <CircleClose class="monitor-chart-card__state-icon" aria-hidden="true" />
                <strong>{{ t('monitor.chart.errorTitle') }}</strong>
                <span>{{ state.message || t('monitor.chart.errorDescription') }}</span>
                <el-button v-if="state.retryable" type="primary" :icon="Refresh" size="small" @click="$emit('retry')">
                    {{ t('monitor.chart.retry') }}
                </el-button>
            </div>

            <template v-else>
                <div v-if="state.status === 'error' && state.stale" class="monitor-chart-card__stale-alert">
                    <span>{{ state.message || t('monitor.chart.refreshFailed') }}</span>
                    <el-button v-if="state.retryable" type="primary" link size="small" @click="$emit('retry')">
                        {{ t('monitor.chart.retry') }}
                    </el-button>
                </div>
                <slot />
            </template>
        </div>

        <footer v-if="lastUpdatedText" class="monitor-chart-card__footer">
            {{ lastUpdatedText }}
        </footer>
    </section>
</template>

<script setup lang="ts">
/** 统一图表标题、副标题、更新时间及加载、空、错误状态外壳。 */
import { computed } from 'vue';
import { CircleClose, DataLine, Refresh } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { MonitorChartSize, MonitorLoadState } from '../monitorTypes';

const props = defineProps<{
    title: string;
    subtitle?: string;
    size: MonitorChartSize;
    state: MonitorLoadState;
}>();

defineEmits<{ retry: [] }>();

const { locale, t } = useI18n();
const lastUpdatedText = computed(() => {
    if ((props.state.status !== 'ready' && props.state.status !== 'error') || !props.state.lastUpdatedAt) return '';
    const date = new Date(props.state.lastUpdatedAt);
    if (Number.isNaN(date.getTime())) return '';
    return t('monitor.chart.lastUpdated', {
        time: new Intl.DateTimeFormat(String(locale.value || 'zh-CN'), {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(date),
    });
});
</script>

<style scoped>
.monitor-chart-card {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    min-width: 0;
    height: 300px;
    padding: 16px 20px;
    overflow: hidden;
    border: 1px solid #E6ECF5;
    border-radius: 8px;
    background: #FFFFFF;
}

.monitor-chart-card.is-large { height: 320px; }
.monitor-chart-card.is-compact { height: 280px; }

.monitor-chart-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    min-width: 0;
    padding-bottom: 10px;
}

.monitor-chart-card__heading { min-width: 0; }
.monitor-chart-card__heading h3 { margin: 0; color: #1F2937; font-size: 15px; font-weight: 600; line-height: 22px; }
.monitor-chart-card__heading p { margin: 2px 0 0; color: #8A97A8; font-size: 12px; line-height: 18px; }
.monitor-chart-card__actions { display: flex; flex: 0 0 auto; align-items: center; min-height: 28px; }
.monitor-chart-card__body { position: relative; min-width: 0; min-height: 0; }
.monitor-chart-card__body > :deep(.analytics-chart) { height: 100% !important; }
.monitor-chart-card__skeleton { padding-top: 8px; }

.monitor-chart-card__state {
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 8px;
    height: 100%;
    color: #8A97A8;
    font-size: 12px;
    text-align: center;
}

.monitor-chart-card__state strong { color: #1F2937; font-size: 14px; font-weight: 600; }
.monitor-chart-card__state-icon { width: 34px; height: 34px; color: #B6C2D2; }
.monitor-chart-card__state.is-error .monitor-chart-card__state-icon { color: #E5484D; }

.monitor-chart-card__stale-alert {
    position: absolute;
    z-index: 2;
    top: 0;
    right: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 30px;
    padding: 4px 10px;
    border: 1px solid #F8D7A0;
    border-radius: 4px;
    color: #9A6700;
    background: #FFF8E8;
    font-size: 12px;
}

.monitor-chart-card__footer {
    padding-top: 6px;
    color: #8A97A8;
    font-size: 11px;
    text-align: right;
}
</style>
