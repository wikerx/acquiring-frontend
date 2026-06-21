<template>
    <section class="merchant-page">
        <div class="merchant-page__hero merchant-page__hero--compact">
            <div>
                <p class="merchant-page__eyebrow">{{ t('placeholder.eyebrow') }}</p>
                <h1>{{ title }}</h1>
                <p class="merchant-page__description">{{ description }}</p>
            </div>
        </div>

        <div class="merchant-content-grid merchant-content-grid--single">
            <section class="merchant-panel">
                <div class="merchant-panel__header">
                    <div>
                        <h2>{{ sectionTitle }}</h2>
                        <p>{{ t('placeholder.baseDescription') }}</p>
                    </div>
                </div>
                <div class="merchant-skeleton-grid">
                    <article v-for="item in cards" :key="item.title" class="merchant-skeleton-card">
                        <span>{{ item.kicker }}</span>
                        <strong>{{ item.title }}</strong>
                        <p>{{ item.description }}</p>
                    </article>
                </div>
            </section>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    pageKey: 'transactions' | 'settlements' | 'account';
}>();
const { t } = useI18n();

const titleMap = computed(() => ({
    transactions: t('layout.transactions'),
    settlements: t('layout.settlements'),
    account: t('layout.account'),
}));

const title = computed(() => titleMap.value[props.pageKey]);

const description = computed(() => {
    if (props.pageKey === 'transactions') {
        return t('placeholder.transactionsDescription');
    }
    if (props.pageKey === 'settlements') {
        return t('placeholder.settlementsDescription');
    }
    return t('placeholder.accountDescription');
});

const sectionTitle = computed(() => `${title.value} · ${t('placeholder.baseSection')}`);

const cards = computed(() => {
    if (props.pageKey === 'transactions') {
        return [
            {
                kicker: t('placeholder.transactionsCards.filter'),
                title: t('placeholder.transactionsCards.filterTitle'),
                description: t('placeholder.transactionsCards.filterDesc'),
            },
            {
                kicker: t('placeholder.transactionsCards.list'),
                title: t('placeholder.transactionsCards.listTitle'),
                description: t('placeholder.transactionsCards.listDesc'),
            },
            {
                kicker: t('placeholder.transactionsCards.actions'),
                title: t('placeholder.transactionsCards.actionsTitle'),
                description: t('placeholder.transactionsCards.actionsDesc'),
            },
        ];
    }
    if (props.pageKey === 'settlements') {
        return [
            {
                kicker: t('placeholder.settlementsCards.overview'),
                title: t('placeholder.settlementsCards.overviewTitle'),
                description: t('placeholder.settlementsCards.overviewDesc'),
            },
            {
                kicker: t('placeholder.settlementsCards.report'),
                title: t('placeholder.settlementsCards.reportTitle'),
                description: t('placeholder.settlementsCards.reportDesc'),
            },
            {
                kicker: t('placeholder.settlementsCards.notify'),
                title: t('placeholder.settlementsCards.notifyTitle'),
                description: t('placeholder.settlementsCards.notifyDesc'),
            },
        ];
    }
    return [
        {
            kicker: t('placeholder.accountCards.profile'),
            title: t('placeholder.accountCards.profileTitle'),
            description: t('placeholder.accountCards.profileDesc'),
        },
        {
            kicker: t('placeholder.accountCards.security'),
            title: t('placeholder.accountCards.securityTitle'),
            description: t('placeholder.accountCards.securityDesc'),
        },
        {
            kicker: t('placeholder.accountCards.config'),
            title: t('placeholder.accountCards.configTitle'),
            description: t('placeholder.accountCards.configDesc'),
        },
    ];
});
</script>
