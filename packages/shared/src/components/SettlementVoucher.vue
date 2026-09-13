<template>
    <article
        class="settlement-voucher settlement-voucher--stable"
        :class="`settlement-voucher--${document.system}`"
        data-testid="settlement-voucher"
    >
        <div
            class="settlement-voucher__security-mark"
            :style="watermarkStyle"
            data-testid="settlement-voucher-watermark"
            aria-hidden="true"
        />

        <div class="settlement-voucher__content">
            <header class="settlement-voucher__masthead">
                <div class="settlement-voucher__brand">
                    <VexraBrandLogo :system="document.system" mode="full" :locale="document.locale" />
                </div>
                <div class="settlement-voucher__heading">
                    <span>{{ document.subtitle }}</span>
                    <h2>{{ document.title }}</h2>
                </div>
                <strong
                    class="settlement-voucher__status-stamp"
                    :class="`is-${document.statusTone}`"
                    :aria-label="statusCaption"
                >
                    {{ document.statusLabel }}
                </strong>
                <dl class="settlement-voucher__reference">
                    <div>
                        <dt>{{ document.referenceLabel }}</dt>
                        <dd>{{ document.referenceNo }}</dd>
                    </div>
                    <div>
                        <dt>{{ document.generatedAtLabel }}</dt>
                        <dd>{{ document.generatedAt }}</dd>
                    </div>
                </dl>
            </header>

            <section class="settlement-voucher__information" data-testid="settlement-voucher-information">
                <section
                    v-for="(group, groupIndex) in document.fieldGroups"
                    :key="group.title"
                    class="settlement-voucher__info-group"
                    :class="{
                        'is-identity': groupIndex === 0,
                        'is-amount': groupIndex === document.fieldGroups.length - 1,
                    }"
                >
                    <h3><span>{{ group.title }}</span></h3>
                    <div
                        v-if="groupIndex === document.fieldGroups.length - 1"
                        class="settlement-voucher__group-amount"
                    >
                        <span>{{ document.netAmountLabel }}</span>
                        <div>
                            <CurrencyDisplay :currency="document.netCurrency" :locale="document.locale" size="md" />
                            <strong>{{ document.netAmount }}</strong>
                        </div>
                    </div>
                    <dl>
                        <div v-for="field in group.fields" :key="field.label">
                            <dt>{{ field.label }}</dt>
                            <dd><VoucherFieldValue :value="field.value" /></dd>
                        </div>
                    </dl>
                </section>
            </section>

            <section v-if="visibleAuditFields.length" class="settlement-voucher__audit">
                <h3>{{ document.auditTitle }}</h3>
                <dl>
                    <div v-for="field in visibleAuditFields" :key="field.label">
                        <dt>{{ field.label }}</dt>
                        <dd><VoucherFieldValue :value="field.value" /></dd>
                    </div>
                </dl>
            </section>

            <VoucherRateMatrix :table="document.rates" />
            <VoucherTable :table="document.summaries" show-sequence />

            <section class="settlement-voucher__notice" :class="`is-${document.statusTone}`">
                <strong>{{ document.noticeTitle }}</strong>
                <p>{{ document.notice }}</p>
            </section>

            <footer class="settlement-voucher__footer">
                <span>{{ document.generatedAtLabel }}: {{ document.generatedAt }}</span>
                <span>{{ document.footer }}</span>
            </footer>
        </div>
    </article>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type CSSProperties, type PropType } from 'vue';
import { getSystemBrand } from '../brand';
import type {
    SettlementVoucherCell,
    SettlementVoucherCurrencyCell,
    SettlementVoucherDirectionCell,
    SettlementVoucherField,
    SettlementVoucherMoneyCell,
    SettlementVoucherPaymentCell,
    SettlementVoucherTable,
} from '../settlementVoucher';
import CurrencyDisplay from './CurrencyDisplay.vue';
import DirectionTag from './DirectionTag.vue';
import PaymentMethodDisplay from './PaymentMethodDisplay.vue';
import VexraBrandLogo from './VexraBrandLogo.vue';
import './SettlementVoucher.css';

const props = defineProps<{
    document: import('../settlementVoucher').SettlementVoucherDocument;
}>();

const watermarkLogo = computed(() => getSystemBrand(props.document.system).logos.icon);
const visibleAuditFields = computed(() => (props.document.auditFields || []).filter(hasDisplayValue));
const statusCaption = computed(() => props.document.locale === 'zh-CN' ? '单据状态' : 'Document status');
const rowUnit = computed(() => props.document.locale === 'zh-CN' ? '项' : 'items');
const sequenceLabel = computed(() => props.document.locale === 'zh-CN' ? '序号' : 'No.');
const watermarkStyle = computed<CSSProperties>(() => ({
    backgroundImage: `url("${watermarkLogo.value}")`,
}));

const VoucherFieldValue = defineComponent({
    name: 'SettlementVoucherFieldValue',
    props: {
        value: { type: [String, Object] as PropType<SettlementVoucherCell>, required: true },
    },
    setup(fieldProps) {
        return () => voucherCell(undefined, fieldProps.value);
    },
});

const VoucherTable = defineComponent({
    name: 'SettlementVoucherTable',
    props: {
        table: { type: Object as PropType<SettlementVoucherTable>, required: true },
        showSequence: { type: Boolean, default: false },
    },
    setup(tableProps) {
        return () => h('section', { class: 'settlement-voucher__section' }, [
            h('div', { class: 'settlement-voucher__section-head' }, [
                h('div', { class: 'settlement-voucher__section-title' }, [
                    h('span', { 'aria-hidden': 'true' }),
                    h('h3', tableProps.table.title),
                ]),
                h('span', { class: 'settlement-voucher__row-count' }, `${tableProps.table.rows.length} ${rowUnit.value}`),
            ]),
            h('div', { class: 'settlement-voucher__table-wrap' }, [
                h('table', { class: 'settlement-voucher__table' }, [
                    h('thead', [h('tr', [
                        ...(tableProps.showSequence ? [h('th', {
                            class: 'is-center is-sequence',
                        }, sequenceLabel.value)] : []),
                        ...tableProps.table.columns.map((column) => h('th', {
                            style: column.width ? { width: `${column.width}%` } : undefined,
                            class: `is-${column.align || 'center'}`,
                        }, column.label)),
                    ])]),
                    h('tbody', tableProps.table.rows.length
                        ? tableProps.table.rows.map((row, index) => h('tr', { key: index }, [
                            ...(tableProps.showSequence ? [h('td', {
                                class: 'is-center is-sequence',
                            }, String(index + 1))] : []),
                            ...tableProps.table.columns.map((column) => h('td', {
                                class: [`is-${column.align || 'center'}`, `is-${column.kind || 'text'}`],
                            }, voucherCell(column.kind, row[column.key]))),
                        ]))
                        : [h('tr', [h('td', {
                            colspan: tableProps.table.columns.length + (tableProps.showSequence ? 1 : 0),
                            class: 'settlement-voucher__empty',
                        }, tableProps.table.emptyText)])]),
                ]),
            ]),
        ]);
    },
});

const VoucherRateMatrix = defineComponent({
    name: 'SettlementVoucherRateMatrix',
    props: {
        table: { type: Object as PropType<SettlementVoucherTable>, required: true },
    },
    setup(tableProps) {
        return () => h('section', { class: 'settlement-voucher__section settlement-voucher__rates' }, [
            h('div', { class: 'settlement-voucher__section-head' }, [
                h('div', { class: 'settlement-voucher__section-title' }, [
                    h('span', { 'aria-hidden': 'true' }),
                    h('h3', tableProps.table.title),
                ]),
                h('span', { class: 'settlement-voucher__row-count' }, `${tableProps.table.rows.length} ${rowUnit.value}`),
            ]),
            tableProps.table.rows.length
                ? h('div', { class: 'settlement-voucher__rate-grid' }, tableProps.table.rows.map((row, index) => h('article', {
                    key: index,
                    class: 'settlement-voucher__rate-item',
                }, [
                    h('div', { class: 'settlement-voucher__rate-flow' }, [
                        rateCurrency(row.sourceCurrency),
                        h('span', { class: 'settlement-voucher__rate-arrow', 'aria-hidden': 'true' }, '→'),
                        rateCurrency(row.targetCurrency),
                    ]),
                    h('dl', { class: 'settlement-voucher__rate-evidence' }, tableProps.table.columns
                        .filter((column) => !['sourceCurrency', 'targetCurrency'].includes(column.key))
                        .map((column) => h('div', { key: column.key }, [
                            h('dt', column.label),
                            h('dd', { class: column.align === 'right' ? 'is-rate-value' : undefined }, voucherCellText(row[column.key])),
                        ]))),
                ])))
                : h('div', { class: 'settlement-voucher__rate-empty' }, tableProps.table.emptyText),
        ]);
    },
});

function hasDisplayValue(field: SettlementVoucherField) {
    const value = voucherCellText(field.value).trim();
    return Boolean(value && value !== '-');
}

function voucherCell(kind: string | undefined, value: SettlementVoucherCell | undefined) {
    if ((kind === 'payment' || isPaymentCell(value)) && isPaymentCell(value)) {
        return h(PaymentMethodDisplay, {
            paymentTypes: value.paymentType
                ? [{ value: value.paymentType, label: value.paymentTypeLabel || value.paymentType }]
                : [],
            paymentMethods: value.paymentMethod
                ? [{ value: value.paymentMethod, label: value.paymentMethodLabel || value.paymentMethod }]
                : [],
        });
    }
    if ((kind === 'currency' || isCurrencyCell(value)) && isCurrencyCell(value)) {
        return h(CurrencyDisplay, {
            currency: value.currency,
            locale: props.document.locale,
            showName: value.showName,
            size: value.showName ? 'sm' : 'xs',
        });
    }
    if ((kind === 'money' || isMoneyCell(value)) && isMoneyCell(value)) {
        return h('span', { class: 'settlement-voucher__money-cell' }, [
            h(CurrencyDisplay, {
                currency: value.currency,
                locale: props.document.locale,
                size: 'xs',
            }),
            h('strong', value.amount || '-'),
        ]);
    }
    if ((kind === 'direction' || isDirectionCell(value)) && isDirectionCell(value)) {
        return h(DirectionTag, {
            direction: value.direction,
            label: value.label,
        });
    }
    return typeof value === 'string' && value ? value : '-';
}

function rateCurrency(value: SettlementVoucherCell | undefined) {
    return h(CurrencyDisplay, {
        currency: currencyCode(value),
        locale: props.document.locale,
        showName: true,
        size: 'md',
    });
}

function currencyCode(value: SettlementVoucherCell | undefined) {
    if (isCurrencyCell(value)) return value.currency || '';
    return typeof value === 'string' ? value : '';
}

function voucherCellText(value: SettlementVoucherCell | undefined) {
    if (typeof value === 'string') return value || '-';
    if (isPaymentCell(value)) {
        return [
            value.paymentTypeLabel || value.paymentType || '',
            value.paymentMethodLabel || value.paymentMethod || '',
        ].filter(Boolean).join(' / ') || '-';
    }
    if (isCurrencyCell(value)) return value.currency || '-';
    if (isMoneyCell(value)) return [value.currency, value.amount].filter(Boolean).join(' ') || '-';
    if (isDirectionCell(value)) return value.label || value.direction || '-';
    return '-';
}

function isPaymentCell(value: SettlementVoucherCell | undefined): value is SettlementVoucherPaymentCell {
    return Boolean(value && typeof value === 'object' && value.cellType === 'payment');
}

function isCurrencyCell(value: SettlementVoucherCell | undefined): value is SettlementVoucherCurrencyCell {
    return Boolean(value && typeof value === 'object' && value.cellType === 'currency');
}

function isMoneyCell(value: SettlementVoucherCell | undefined): value is SettlementVoucherMoneyCell {
    return Boolean(value && typeof value === 'object' && value.cellType === 'money');
}

function isDirectionCell(value: SettlementVoucherCell | undefined): value is SettlementVoucherDirectionCell {
    return Boolean(value && typeof value === 'object' && value.cellType === 'direction');
}
</script>
