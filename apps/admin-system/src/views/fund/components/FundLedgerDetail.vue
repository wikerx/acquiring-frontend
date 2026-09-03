<template>
    <div class="fund-ledger-detail">
        <section class="amount-flow" :class="ledger.direction === 'CREDIT' ? 'is-credit' : 'is-debit'">
            <div>
                <span>{{ $t('feeAccount.balanceBefore') }}</span>
                <strong><BaseAmount :value="ledger.balanceBefore" :currency="ledger.currency" currency-display="code" /></strong>
            </div>
            <div class="amount-flow__change">
                <span>{{ $t('feeAccount.occurredAmount') }}</span>
                <strong><BaseAmount :value="ledger.amount" :currency="ledger.currency" currency-display="code" /></strong>
                <DirectionTag :direction="ledger.direction" :label="ledger.direction === 'CREDIT' ? $t('feeAccount.credit') : $t('feeAccount.debit')" />
            </div>
            <div>
                <span>{{ $t('feeAccount.balanceAfter') }}</span>
                <strong><BaseAmount :value="ledger.balanceAfter" :currency="ledger.currency" currency-display="code" /></strong>
            </div>
        </section>

        <section v-if="deduction" class="detail-band is-deduction">
            <div class="detail-band__heading">
                <h4>{{ $t('feeAccount.deductionInformation') }}</h4>
                <el-tag :type="deductionStatusType" effect="light">{{ $t(`feeAccount.deductionStatus.${deduction.deductionStatus}`) }}</el-tag>
            </div>
            <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('feeAccount.deductionNo')">{{ deduction.deductionNo }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.requestId')">{{ deduction.requestId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.merchant')" :span="2"><MerchantIdentityDisplay :merchant-id="deduction.merchantId" :merchant-name="deduction.merchantName" /></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.accountNo')">{{ deduction.accountNo || ledger.accountNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.deductionCategory')">{{ $t(`feeAccount.deductionCategoryValue.${deduction.deductionCategory}`) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.deductionReason')" :span="2">{{ deduction.reason }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.submitter')">{{ deduction.submitByName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.submitTime')"><BaseDateTime :value="deduction.submitTime" /></el-descriptions-item>
            </el-descriptions>
        </section>

        <section v-if="recharge" class="detail-band is-recharge">
            <div class="detail-band__heading">
                <h4>{{ $t('feeAccount.rechargeInformation') }}</h4>
                <el-tag :type="rechargeStatusType" effect="light">
                    {{ $t(`feeAccount.rechargeStatus.${recharge.rechargeStatus}`) }}
                </el-tag>
            </div>
            <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('feeAccount.rechargeNo')">{{ recharge.rechargeNo }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.requestId')">{{ recharge.requestId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.merchant')" :span="2"><MerchantIdentityDisplay :merchant-id="recharge.merchantId" :merchant-name="recharge.merchantName" /></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.accountNo')">{{ recharge.accountNo || ledger.accountNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.rechargeCurrency')">{{ recharge.currency }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.remark')" :span="2">{{ recharge.remark || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.submitter')">{{ recharge.submitByName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.submitTime')"><BaseDateTime :value="recharge.submitTime" /></el-descriptions-item>
            </el-descriptions>
        </section>

        <section v-if="hasAudit" class="detail-band is-audit">
            <h4>{{ $t('feeAccount.auditInformation') }}</h4>
            <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('feeAccount.auditor')">{{ reviewRecord?.auditByName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.auditTime')"><BaseDateTime :value="reviewRecord?.auditTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.auditComment')" :span="2">{{ reviewRecord?.auditComment || '-' }}</el-descriptions-item>
            </el-descriptions>
        </section>

        <section v-if="hasRecheck" class="detail-band is-recheck">
            <h4>{{ $t('feeAccount.recheckInformation') }}</h4>
            <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('feeAccount.rechecker')">{{ reviewRecord?.recheckByName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.recheckTime')"><BaseDateTime :value="reviewRecord?.recheckTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.recheckComment')" :span="2">{{ reviewRecord?.recheckComment || '-' }}</el-descriptions-item>
            </el-descriptions>
        </section>

        <section v-if="hasRejection" class="detail-band is-reject">
            <h4>{{ $t('feeAccount.rejectInformation') }}</h4>
            <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('feeAccount.rejectOperator')">{{ reviewRecord?.rejectByName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.rejectTime')"><BaseDateTime :value="reviewRecord?.rejectTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.rejectComment')" :span="2">{{ reviewRecord?.rejectComment || '-' }}</el-descriptions-item>
            </el-descriptions>
        </section>

        <section v-if="!recharge && !deduction" class="detail-band is-business">
            <h4>{{ $t('feeAccount.ledgerBusinessInfo') }}</h4>
            <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('feeAccount.merchant')" :span="2"><MerchantIdentityDisplay :merchant-id="ledger.merchantId" :merchant-name="ledger.merchantName" /></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.accountNo')">{{ ledger.accountNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.businessType')">{{ businessTypeLabel || ledger.businessType }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.summary')" :span="2">{{ ledger.summary || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.businessNo')">{{ ledger.businessNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.transactionId')">{{ ledger.transactionId || '-' }}</el-descriptions-item>
            </el-descriptions>
        </section>

        <section v-if="!recharge && !deduction" class="detail-band is-operation">
            <h4>{{ $t('feeAccount.ledgerAuditInfo') }}</h4>
            <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('feeAccount.operator')">{{ ledger.operatorName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.reviewer')">{{ ledger.reviewerName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.operationReason')" :span="2">{{ ledger.operationReason || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.reviewComment')" :span="2">{{ ledger.reviewComment || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.businessTime')"><BaseDateTime :value="ledger.businessTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.postedTime')"><BaseDateTime :value="ledger.postedTime" /></el-descriptions-item>
            </el-descriptions>
        </section>

        <section class="detail-band is-ledger">
            <h4>{{ $t('feeAccount.ledgerVerificationInfo') }}</h4>
            <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('feeAccount.ledgerNo')">{{ ledger.ledgerNo }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.ledgerGroupNo')">{{ ledger.ledgerGroupNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.ledgerSequence')">{{ ledger.accountSequence }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.balanceType')">{{ ledger.balanceType }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.businessType')">{{ businessTypeLabel || ledger.businessType }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.operationMode')">{{ ledger.operationMode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.settlementBatchNo')">{{ ledger.settlementBatchNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.feeDetailNo')">{{ ledger.feeDetailNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.requestId')">{{ ledger.requestId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.idempotencyKey')">{{ ledger.idempotencyKey || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.traceId')">{{ ledger.traceId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.reversalLedgerId')">{{ ledger.reversalOfLedgerId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.postedTime')"><BaseDateTime :value="ledger.postedTime" /></el-descriptions-item>
            </el-descriptions>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DirectionTag, MerchantIdentityDisplay } from '@acquiring/shared';
import type { FundLedger } from '@/api/fund';
import BaseAmount from '@/components/BaseAmount/index.vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';

const props = withDefaults(defineProps<{
    ledger: FundLedger;
    businessTypeLabel?: string;
}>(), {
    businessTypeLabel: '',
});

const recharge = computed(() => props.ledger.rechargeDetail || null);
const deduction = computed(() => props.ledger.deductionDetail || null);
const reviewRecord = computed(() => recharge.value || deduction.value);
const hasAudit = computed(() => Boolean(reviewRecord.value?.auditByName || reviewRecord.value?.auditTime || reviewRecord.value?.auditComment));
const hasRecheck = computed(() => Boolean(reviewRecord.value?.recheckByName || reviewRecord.value?.recheckTime || reviewRecord.value?.recheckComment));
const hasRejection = computed(() => Boolean(reviewRecord.value?.rejectByName || reviewRecord.value?.rejectTime || reviewRecord.value?.rejectComment));
const rechargeStatusType = computed(() => {
    if (recharge.value?.rechargeStatus === 'POSTED') return 'success';
    if (recharge.value?.rechargeStatus === 'REJECTED') return 'danger';
    return recharge.value?.rechargeStatus === 'PENDING_RECHECK' ? 'warning' : 'info';
});
const deductionStatusType = computed(() => {
    if (deduction.value?.deductionStatus === 'POSTED') return 'success';
    if (deduction.value?.deductionStatus === 'REJECTED') return 'danger';
    return deduction.value?.deductionStatus === 'PENDING_RECHECK' ? 'warning' : 'info';
});
</script>

<style scoped>
.fund-ledger-detail { display: grid; gap: 16px; min-width: 0; }
.amount-flow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: hidden; border: 1px solid #e1e7ee; border-radius: 6px; background: #fff; }
.amount-flow > div { position: relative; min-width: 0; padding: 17px 18px; border-right: 1px solid #e7ebf0; background: #f8fafc; }
.amount-flow > div:last-child { border-right: 0; }
.amount-flow span { display: block; color: #778196; font-size: 12px; }
.amount-flow strong { display: block; margin-top: 7px; overflow: hidden; color: #17243a; font-size: 17px; font-variant-numeric: tabular-nums; letter-spacing: 0; text-overflow: ellipsis; white-space: nowrap; }
.amount-flow__change { padding-right: 84px !important; }
.amount-flow__change .el-tag { position: absolute; top: 14px; right: 14px; display: inline-flex; align-items: center; justify-content: center; min-width: 56px; border-radius: 4px; }
.amount-flow.is-credit .amount-flow__change { background: #f3faf7; box-shadow: inset 0 3px 0 #1f9d78; }
.amount-flow.is-credit .amount-flow__change strong { color: #15785d; }
.amount-flow.is-debit .amount-flow__change { background: #fff7f6; box-shadow: inset 0 3px 0 #d45d56; }
.amount-flow.is-debit .amount-flow__change strong { color: #b54740; }
.detail-band { padding: 14px 16px 8px; border-left: 3px solid #94a3b8; border-radius: 4px; background: #f8fafc; }
.detail-band h4 { margin: 0 0 10px; color: #344054; font-size: 13px; font-weight: 700; letter-spacing: 0; }
.detail-band__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.detail-band__heading .el-tag { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 4px; }
.detail-band.is-recharge,
.detail-band.is-business { border-left-color: #3b82c4; background: #f5faff; }
.detail-band.is-deduction { border-left-color: #d45d56; background: #fff7f6; }
.detail-band.is-audit { border-left-color: #d49b2f; background: #fffbf2; }
.detail-band.is-recheck,
.detail-band.is-operation { border-left-color: #1f9d78; background: #f3faf7; }
.detail-band.is-reject { border-left-color: #d45d56; background: #fff7f6; }
.detail-band.is-ledger { border-left-color: #7c8798; background: #f8fafc; }
.detail-band :deep(.el-descriptions__body) { background: transparent; }
.detail-band :deep(.el-descriptions__table) { table-layout: fixed; }
.detail-band :deep(.el-descriptions__cell) { padding-bottom: 9px; }
.detail-band :deep(.el-descriptions__label) { color: #526071; font-weight: 600; }
.detail-band :deep(.el-descriptions__content) { color: #263244; overflow-wrap: anywhere; }
@media (max-width: 720px) {
    .amount-flow { grid-template-columns: 1fr; }
    .amount-flow > div { border-right: 0; border-bottom: 1px solid #e7ebf0; }
    .amount-flow > div:last-child { border-bottom: 0; }
}
</style>
