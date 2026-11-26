<template>
    <section class="alert-guide" aria-labelledby="alert-platform-guide-title">
        <header class="guide-intro">
            <h2 id="alert-platform-guide-title">{{ t('alertConfig.guide.title') }}</h2>
            <p>{{ t('alertConfig.guide.intro') }}</p>
        </header>

        <div class="guide-products">
            <article v-for="product in guideProducts" :key="product.key" class="guide-product">
                <div class="guide-product-logo" :class="product.key">
                    <img :src="product.logo" alt="" width="88" height="44" decoding="async" />
                </div>
                <div>
                    <h3>{{ t(`alertConfig.guide.${product.key}.title`) }}</h3>
                    <p>{{ t(`alertConfig.guide.${product.key}.description`) }}</p>
                </div>
            </article>
        </div>

        <section class="guide-workflows" aria-labelledby="alert-guide-workflows-title">
            <h3 id="alert-guide-workflows-title">{{ t('alertConfig.guide.workflowsTitle') }}</h3>
            <p>{{ t('alertConfig.guide.workflowsScope') }}</p>
            <details v-for="product in guideProducts" :key="product.key" class="guide-workflow">
                <summary>
                    <span>{{ t(`alertConfig.guide.${product.key}.title`) }}</span>
                    <el-icon aria-hidden="true"><ArrowDown /></el-icon>
                </summary>
                <ProductAlertFlow :product="product.key" :logo="product.logo" />
                <a class="guide-reference" :href="product.reference" target="_blank" rel="noopener noreferrer">
                    {{ t(`alertConfig.guide.${product.key}.reference`) }}
                </a>
            </details>
        </section>

        <ol class="guide-steps" :aria-label="t('alertConfig.guide.steps')">
            <li v-for="step in guideSteps" :key="step.key">
                <el-icon class="guide-step-icon" aria-hidden="true"><component :is="step.icon" /></el-icon>
                <div>
                    <h3>{{ t(`alertConfig.guide.${step.key}.title`) }}</h3>
                    <p>{{ t(`alertConfig.guide.${step.key}.description`) }}</p>
                </div>
            </li>
        </ol>
    </section>
</template>

<script setup lang="ts">
import { ArrowDown, Connection, Key, Link } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { disputeAlertLogos } from '@acquiring/shared';
import amexInquiry from '../dispute-alert/assets/amex-inquiry.png';
import ProductAlertFlow from './ProductAlertFlow.vue';

const { t } = useI18n();
const { ETHOCA: ethoca, RDR: verifi } = disputeAlertLogos;
const guideProducts = [
    {
        key: 'ethoca',
        logo: ethoca,
        reference: 'https://developer.mastercard.com/ethoca-alerts-for-merchants/documentation/tutorials-and-guides/outcome-api-tutorial/index.md',
    },
    {
        key: 'rdr',
        logo: verifi,
        reference: 'https://www.verifi.com/rapid-dispute-resolution-rules-attributes-faq.html',
    },
    {
        key: 'cdrn',
        logo: verifi,
        reference: 'https://www.verifi.com/wp-content/uploads/2014/11/CDRN_Merchant_Portal-4.pdf',
    },
    {
        key: 'amexInquiry',
        logo: amexInquiry,
        reference: 'https://www.americanexpress.com/content/dam/amex/us/merchant/merchant-rules/International-Regs-April-2026-vEN.pdf#page=42',
    },
] as const;
const guideSteps = [
    { key: 'platform', icon: Connection },
    { key: 'account', icon: Key },
    { key: 'mid', icon: Link },
];
</script>

<style scoped>
.alert-guide {
    container-type: inline-size;
    margin-block-start: 20px;
    padding: clamp(16px, 2vw, 24px);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    background: var(--el-bg-color);
}
.guide-intro {
    padding-inline-start: 14px;
    border-inline-start: 3px solid var(--el-color-primary);
}
.guide-intro h2 {
    margin: 0 0 4px;
    color: var(--el-text-color-primary);
    font-size: 21px;
    line-height: 1.35;
}
.alert-guide p {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.55;
}
.alert-guide h3 {
    margin: 0 0 4px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 1.45;
}
.guide-products,
.guide-steps {
    display: grid;
    gap: 12px;
}
.guide-products {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-block: 18px;
}
.guide-product,
.guide-steps li {
    display: flex;
    min-inline-size: 0;
    gap: 12px;
}
.guide-product {
    align-items: center;
    padding: 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-extra-light);
}
.guide-product-logo {
    display: grid;
    flex: none;
    width: 100px;
    height: 60px;
    place-items: center;
    border-radius: var(--el-border-radius-base);
    background: #eef4ff;
}
.guide-product-logo.ethoca {
    background: #fff3e8;
}
.guide-product-logo img {
    object-fit: contain;
}
.guide-workflows {
    margin-block-end: 18px;
}
.guide-workflow {
    margin-block-start: 8px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-extra-light);
}
.guide-workflow summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 12px;
    border-radius: inherit;
    color: var(--el-text-color-primary);
    font-weight: 600;
    line-height: 1.4;
    list-style: none;
    cursor: pointer;
}
.guide-workflow summary::-webkit-details-marker {
    display: none;
}
.guide-workflow summary:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -2px;
}
.guide-workflow summary .el-icon {
    flex: none;
    color: var(--el-text-color-secondary);
}
.guide-workflow[open] summary .el-icon {
    transform: rotate(180deg);
}
.guide-reference {
    display: inline-block;
    margin: 10px 12px 12px;
    color: var(--el-color-primary);
    font-size: 13px;
    text-decoration: underline;
    text-underline-offset: 2px;
}
.guide-steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
    padding: 16px 0 0;
    border-top: 1px solid var(--el-border-color-lighter);
    list-style: none;
}
.guide-step-icon {
    flex: none;
    box-sizing: content-box;
    padding: 7px;
    border-radius: var(--el-border-radius-base);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 16px;
}
@container (min-width: 1560px) {
    .guide-products {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}
@container (max-width: 600px) {
    .guide-products,
    .guide-steps {
        grid-template-columns: minmax(0, 1fr);
    }
    .guide-product-logo {
        width: 84px;
        height: 52px;
    }
    .guide-product-logo img {
        width: 72px;
    }
}
</style>
