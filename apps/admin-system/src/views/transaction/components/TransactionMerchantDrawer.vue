<template>
    <CommonDetailDrawer v-model:visible="drawerVisible" :title="t('transaction.merchant.title')" size="xl" :loading="loading">
        <div v-if="merchant" class="transaction-merchant">
            <section class="transaction-merchant__summary">
                <div>
                    <span>{{ t('merchant.info.merchantId') }}</span>
                    <strong>{{ merchant.merchantId || '-' }}</strong>
                </div>
                <div>
                    <span>{{ t('merchant.info.merchantName') }}</span>
                    <strong>{{ merchant.merchantName || '-' }}</strong>
                </div>
                <div>
                    <span>{{ t('common.status') }}</span>
                    <el-tag size="small" :type="merchantStatusType(merchant.merchantStatus)">{{ merchantStatusText(merchant.merchantStatus) }}</el-tag>
                </div>
                <div>
                    <span>{{ t('merchant.info.settlementCurrency') }}</span>
                    <strong>{{ merchant.settlementCurrency || '-' }}</strong>
                </div>
            </section>

            <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="MCC">{{ merchant.merchantCategoryCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.countryCode')">{{ merchant.countryCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.timezone')">{{ merchant.timezone || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.billingDescriptor')">{{ merchant.billingDescriptor || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.contactName')">{{ merchant.contactName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.contactEmail')">{{ merchant.contactEmail || '-' }}</el-descriptions-item>
            </el-descriptions>

            <section class="transaction-merchant__section">
                <div class="transaction-merchant__section-title">{{ t('transaction.merchant.midBindings') }}</div>
                <StandardTable table-key="transaction-merchant-mid-bindings" :data="bindings" row-key="id" size="small">
                    <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="116" align="center" />
                    <el-table-column prop="channelMid" :label="t('transaction.merchant.channelMid')" min-width="156" align="center" :show-overflow-tooltip="true" />
                    <el-table-column :label="t('transaction.fields.paymentMethodCardBrand')" min-width="170" align="center">
                        <template #default="{ row }">
                            <PaymentLogoGroup v-if="bindingPaymentLogos(row).length" :keys="bindingPaymentLogos(row)" size="sm" align="center" />
                            <span v-else>-</span>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('transaction.merchant.defaultSettlementCurrency')" width="140" align="center">
                        <template #default="{ row }">{{ midById.get(row.midConfigId)?.defaultSettlementCurrency || '-' }}</template>
                    </el-table-column>
                    <el-table-column :label="t('common.status')" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag size="small" :type="row.bindingStatus === 1 ? 'success' : 'info'">
                                {{ row.bindingStatus === 1 ? t('common.enable') : t('common.disable') }}
                            </el-tag>
                        </template>
                    </el-table-column>
                </StandardTable>
            </section>
        </div>
        <el-empty v-else :description="t('transaction.detail.empty')" />
    </CommonDetailDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { searchChannelMids, searchMerchantChannelMidBindings, type ChannelMidConfig, type MerchantChannelMidBinding } from '@/api/channel';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { cardLogoKeys, paymentLogoKeys } from '@/views/channel/shared';

const props = defineProps<{
    visible: boolean;
    merchantId: string;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
}>();

const { t } = useI18n();
const loading = ref(false);
const merchant = ref<MerchantInfo | null>(null);
const bindings = ref<MerchantChannelMidBinding[]>([]);
const mids = ref<ChannelMidConfig[]>([]);

const drawerVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});

const midById = computed(() => new Map(mids.value.map((item) => [item.id, item])));

watch(() => [props.visible, props.merchantId] as const, ([visible, merchantId]) => {
    if (visible && merchantId) {
        loadMerchant(merchantId);
    }
});

async function loadMerchant(merchantId: string) {
    loading.value = true;
    try {
        const [merchantResult, bindingResult, midResult] = await Promise.all([
            searchMerchants({ pageNo: 1, pageSize: 1, keyword: merchantId }),
            searchMerchantChannelMidBindings({ pageNo: 1, pageSize: 200, merchantId }),
            searchChannelMids({ pageNo: 1, pageSize: 500 }),
        ]);
        merchant.value = merchantResult.records.find((item) => item.merchantId === merchantId) || merchantResult.records[0] || null;
        bindings.value = bindingResult.records;
        mids.value = midResult.records;
    } finally {
        loading.value = false;
    }
}

function bindingPaymentLogos(row: MerchantChannelMidBinding): PaymentLogoKey[] {
    const mid = midById.value.get(row.midConfigId);
    if (!mid) {
        return [];
    }
    return splitScope(mid.paymentMethodScope).flatMap((method) => {
        if (method === 'BANK_CARD') {
            const brands = splitScope(mid.cardBrandScope).filter((brand) => brand !== 'NONE');
            return brands.length ? brands.flatMap((brand) => cardLogoKeys(brand)) : cardLogoKeys();
        }
        return paymentLogoKeys(method);
    });
}

function splitScope(value?: string) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function merchantStatusType(status?: number) {
    if (status === 1) {
        return 'success';
    }
    if (status === 2) {
        return 'warning';
    }
    return 'info';
}

function merchantStatusText(status?: number) {
    if (status === 1) {
        return t('merchant.info.statusNormal');
    }
    if (status === 2) {
        return t('merchant.info.statusFrozen');
    }
    if (status === 3) {
        return t('merchant.info.statusClosed');
    }
    return '-';
}
</script>

<style scoped>
.transaction-merchant {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.transaction-merchant__summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.transaction-merchant__summary > div {
    min-width: 0;
    padding: 12px 14px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
}

.transaction-merchant__summary span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-merchant__summary strong {
    display: block;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-merchant__section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.transaction-merchant__section-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
}

@media (max-width: 980px) {
    .transaction-merchant__summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .transaction-merchant__summary {
        grid-template-columns: 1fr;
    }
}
</style>
