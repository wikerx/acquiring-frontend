<template>
    <section class="monitoring-availability" aria-labelledby="analytics-monitoring-heading">
        <h2 id="analytics-monitoring-heading">{{ t('transactionAnalytics.monitoringTitle') }}</h2>
        <dl>
            <div>
                <dt>{{ t('transactionAnalytics.fraudRate') }}</dt>
                <dd>{{ t('transactionAnalytics.monitoringMissing') }}</dd>
            </div>
            <div>
                <dt>{{ t('transactionAnalytics.disputeRate') }}</dt>
                <dd>{{ t('transactionAnalytics.monitoringMissing') }}</dd>
            </div>
            <div>
                <dt>Visa VAMP</dt>
                <dd>{{ t(vampNotApplicable ? 'transactionAnalytics.monitoringNotApplicable' : 'transactionAnalytics.monitoringMissing') }}</dd>
            </div>
        </dl>
        <p>{{ t('transactionAnalytics.monitoringCoverage') }}</p>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ cardBrand?: string }>();
const { t } = useI18n();
const vampNotApplicable = computed(() => {
    const brand = props.cardBrand?.trim().toUpperCase();
    // 只有已应用的单一卡品牌筛选能排除 Visa，钱包本身不能推断底层品牌。
    return Boolean(brand && !['VISA', 'UNKNOWN', 'NONE', 'ALL'].includes(brand));
});
</script>

<style scoped>
.monitoring-availability {
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-bg-color);
}

.monitoring-availability h2 {
    margin: 0 0 12px;
    font-size: 16px;
}

.monitoring-availability dl {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin: 0;
}

.monitoring-availability dl div {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: baseline;
}

.monitoring-availability dd {
    margin: 0;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
}

.monitoring-availability p {
    margin: 10px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
}
</style>
