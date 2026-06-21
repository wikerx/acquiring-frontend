<template>
    <section class="merchant-page">
        <div class="merchant-page__hero">
            <div>
                <p class="merchant-page__eyebrow">{{ t('dashboard.eyebrow') }}</p>
                <h1>{{ t('dashboard.title') }}</h1>
                <p class="merchant-page__description">{{ t('dashboard.description') }}</p>
            </div>
            <div class="merchant-page__hero-card">
                <span>{{ t('dashboard.currentMerchant') }}</span>
                <strong>{{ auth.session?.account.realName || auth.session?.account.loginAccount || t('layout.fallbackMerchant') }}</strong>
                <small>{{ auth.session?.account.merchantId || 'M2026000001' }}</small>
            </div>
        </div>

        <div class="merchant-metric-grid">
            <article v-for="item in metrics" :key="item.label" class="merchant-metric-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.hint }}</small>
            </article>
        </div>

        <div class="merchant-content-grid">
            <section class="merchant-panel">
                <div class="merchant-panel__header">
                    <div>
                        <h2>{{ t('dashboard.tasksTitle') }}</h2>
                        <p>{{ t('dashboard.tasksDescription') }}</p>
                    </div>
                </div>
                <div class="merchant-task-list">
                    <article v-for="item in tasks" :key="item.title" class="merchant-task-item">
                        <div>
                            <strong>{{ item.title }}</strong>
                            <p>{{ item.description }}</p>
                        </div>
                        <span>{{ item.count }}</span>
                    </article>
                </div>
            </section>

            <section class="merchant-panel">
                <div class="merchant-panel__header">
                    <div>
                        <h2>{{ t('dashboard.ordersTitle') }}</h2>
                        <p>{{ t('dashboard.ordersDescription') }}</p>
                    </div>
                </div>
                <div class="merchant-order-list">
                    <article v-for="item in orders" :key="item.orderNo" class="merchant-order-item">
                        <div>
                            <strong>{{ item.orderNo }}</strong>
                            <p>{{ item.buyer }}</p>
                        </div>
                        <div class="merchant-order-item__meta">
                            <span :class="['merchant-status-tag', `merchant-status-tag--${item.statusTone}`]">
                                {{ item.status }}
                            </span>
                            <strong>{{ item.amount }}</strong>
                        </div>
                    </article>
                </div>
            </section>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/authStore';

const auth = useAuthStore();
const { t } = useI18n();

const metrics = computed(() => [
    { label: t('dashboard.metrics.amount'), value: 'USD 28,490', hint: t('dashboard.metrics.amountHint') },
    { label: t('dashboard.metrics.successCount'), value: '1,284', hint: t('dashboard.metrics.successCountHint') },
    { label: t('dashboard.metrics.refundPending'), value: '18', hint: t('dashboard.metrics.refundPendingHint') },
    { label: t('dashboard.metrics.settlementPending'), value: 'USD 6,540', hint: t('dashboard.metrics.settlementPendingHint') },
]);

const tasks = computed(() => [
    { title: t('dashboard.tasks.risk'), description: t('dashboard.tasks.riskDesc'), count: '6' },
    { title: t('dashboard.tasks.refund'), description: t('dashboard.tasks.refundDesc'), count: '18' },
    { title: t('dashboard.tasks.settlement'), description: t('dashboard.tasks.settlementDesc'), count: '2' },
]);

const orders = computed(() => [
    { orderNo: 'VX202606210001', buyer: 'Jessica Miller', status: t('dashboard.orderStatus.success'), statusTone: 'success', amount: 'USD 429.00' },
    { orderNo: 'VX202606210002', buyer: 'Mateo Ruiz', status: t('dashboard.orderStatus.processing'), statusTone: 'warning', amount: 'USD 118.00' },
    { orderNo: 'VX202606210003', buyer: 'Olivia Chen', status: t('dashboard.orderStatus.failed'), statusTone: 'danger', amount: 'USD 92.00' },
]);
</script>
