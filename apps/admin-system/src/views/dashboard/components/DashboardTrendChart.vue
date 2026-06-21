<template>
    <section class="dashboard-panel">
        <header class="dashboard-panel__header dashboard-panel__header--with-actions">
            <div>
                <h2>{{ title }}</h2>
                <p>{{ description }}</p>
            </div>
            <el-radio-group :model-value="activeMetric" size="small" @update:model-value="onMetricChange">
                <el-radio-button value="login">{{ loginLabel }}</el-radio-button>
                <el-radio-button value="oper">{{ operLabel }}</el-radio-button>
            </el-radio-group>
        </header>
        <div v-if="points.length" class="dashboard-trend">
            <div class="dashboard-trend__legend">
                <span class="dashboard-trend__legend-dot" :class="`dashboard-trend__legend-dot--${activeMetric}`" />
                <strong>{{ activeMetric === 'login' ? loginLabel : operLabel }}</strong>
            </div>
            <div class="dashboard-trend__chart">
                <div
                    v-for="point in bars"
                    :key="point.date"
                    class="dashboard-trend__bar-item"
                >
                    <el-tooltip :content="point.tooltip" placement="top">
                        <div class="dashboard-trend__bar-track">
                            <div
                                class="dashboard-trend__bar"
                                :class="`dashboard-trend__bar--${activeMetric}`"
                                :style="{ height: `${point.height}%` }"
                            />
                        </div>
                    </el-tooltip>
                    <span class="dashboard-trend__bar-date">{{ point.label }}</span>
                </div>
            </div>
        </div>
        <el-empty v-else :description="emptyText" :image-size="86" />
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardTrendPoint } from '../dashboard.mock';

type TrendMetric = 'login' | 'oper';

interface Props {
    title: string;
    description: string;
    loginLabel: string;
    operLabel: string;
    emptyText: string;
    activeMetric: TrendMetric;
    points: DashboardTrendPoint[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ metricChange: [metric: TrendMetric] }>();

const bars = computed(() => {
    const values = props.points.map((point) => props.activeMetric === 'login' ? point.loginCount : point.operCount);
    const maxValue = Math.max(...values, 1);
    return props.points.map((point) => {
        const value = props.activeMetric === 'login' ? point.loginCount : point.operCount;
        return {
            date: point.date,
            label: point.date.slice(5),
            tooltip: `${point.date} · ${value}`,
            height: Math.max(10, Math.round((value / maxValue) * 100)),
        };
    });
});

function onMetricChange(value: string | number | boolean) {
    if (value === 'login' || value === 'oper') {
        emit('metricChange', value);
    }
}
</script>

<style scoped>
.dashboard-panel {
    border: 1px solid #e7edf4;
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.dashboard-panel__header {
    padding: 22px 24px 0;
}

.dashboard-panel__header--with-actions {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.dashboard-panel__header h2 {
    margin: 0;
    color: #0f172a;
    font-size: 18px;
    font-weight: 700;
}

.dashboard-panel__header p {
    margin: 8px 0 0;
    color: #64748b;
    font-size: 13px;
}

.dashboard-trend {
    padding: 18px 24px 24px;
}

.dashboard-trend__legend {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: #334155;
    font-size: 13px;
}

.dashboard-trend__legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
}

.dashboard-trend__legend-dot--login {
    background: linear-gradient(180deg, #2563eb 0%, #60a5fa 100%);
}

.dashboard-trend__legend-dot--oper {
    background: linear-gradient(180deg, #0ea5a4 0%, #5eead4 100%);
}

.dashboard-trend__chart {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 14px;
    align-items: end;
    min-height: 280px;
}

.dashboard-trend__bar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    height: 100%;
}

.dashboard-trend__bar-track {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: 220px;
    padding: 12px 0;
    border-radius: 14px;
    background: linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%);
}

.dashboard-trend__bar {
    width: 28px;
    min-height: 18px;
    border-radius: 999px;
    box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.28);
}

.dashboard-trend__bar--login {
    background: linear-gradient(180deg, #2563eb 0%, #60a5fa 100%);
}

.dashboard-trend__bar--oper {
    background: linear-gradient(180deg, #0ea5a4 0%, #5eead4 100%);
}

.dashboard-trend__bar-date {
    color: #64748b;
    font-size: 12px;
}

@media (max-width: 768px) {
    .dashboard-panel__header--with-actions {
        flex-direction: column;
    }

    .dashboard-trend__chart {
        gap: 8px;
    }

    .dashboard-trend__bar {
        width: 20px;
    }
}
</style>
