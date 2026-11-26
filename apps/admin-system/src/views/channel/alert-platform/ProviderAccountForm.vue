<template>
    <div class="provider-review" role="group" :aria-label="label('configuration')">
        <section class="provider-section" aria-labelledby="provider-basic-heading">
            <header class="section-heading">
                <h3 id="provider-basic-heading">{{ label('basic') }}</h3>
                <el-tag size="small" effect="plain" type="info">{{ label('neededForDraft') }}</el-tag>
            </header>
            <div class="provider-grid">
                <el-form-item :label="t('alertConfig.accountIdentifier')" prop="review.identifier" :error="errors.identifier" required>
                    <el-input v-model.trim="identifier" :validate-event="false" :disabled="registered.size > 0" maxlength="80" autocomplete="off" @input="delete errors.identifier" />
                </el-form-item>
                <el-form-item :label="t('alertConfig.accountProducts')" prop="review.products" :error="errors.products" required>
                    <el-select v-model="selected" :validate-event="false" multiple :placeholder="t('common.pleaseSelect')" @change="delete errors.products">
                        <el-option v-for="item in platform.products" :key="item.product" :value="item.product"
                            :label="productName(item.product)" :disabled="registeredProducts.has(item.product) || !item.enabled">
                            <AlertProductDisplay :product="item.product" />
                        </el-option>
                    </el-select>
                </el-form-item>
            </div>
            <ul v-if="selected.length" class="product-controls">
                <li v-for="product in selected" :key="product">
                    <AlertProductDisplay :product="product" compact />
                    <el-tag :type="productStatusType(product)" size="small" effect="plain">
                        {{ t('alertConfig.status.' + productStatus(product)) }}
                    </el-tag>
                    <el-button type="primary" link size="small" :disabled="!canToggleProduct(product)"
                        :aria-label="t('alertConfig.toggleAccountProduct', { action: productAction(product), product: productName(product) })"
                        @click="toggleProduct(product)">{{ productAction(product) }}</el-button>
                </li>
            </ul>
        </section>

        <section class="provider-section" aria-labelledby="provider-delivery-heading">
            <header class="section-heading">
                <h3 id="provider-delivery-heading">{{ label('configuration') }}</h3>
                <el-tag v-if="code === 'AUSTREME'" size="small" effect="plain" type="warning">{{ label('pending') }}</el-tag>
                <el-tag v-else size="small" effect="plain">{{ label('neededForEnable') }}</el-tag>
            </header>
            <p v-if="code === 'AUSTREME'" class="section-note">{{ label('austremeNotice') }}</p>
            <div class="provider-grid">
                <el-form-item v-for="field in settings" :key="field.key" :label="label(field.key)" :prop="'review.' + field.key"
                    :error="errors[field.key]" :required="tryingEnable && field.required">
                    <el-select v-if="field.options" :validate-event="false" :model-value="values[field.key] ?? (field.kind === 'multiple' ? [] : '')"
                        :multiple="field.kind === 'multiple'" :aria-label="label(field.key)" clearable :placeholder="t('common.pleaseSelect')"
                        @update:model-value="updateSetting(field.key, $event)">
                        <el-option v-for="option in field.options" :key="option" :value="option"
                            :label="optionLabel(option)" />
                    </el-select>
                    <el-input v-else :validate-event="false" :model-value="String(values[field.key] ?? '')" :aria-label="label(field.key)" :maxlength="field.kind === 'url' ? 250 : 120"
                        :placeholder="field.kind === 'url' ? 'https://' : undefined" autocomplete="off"
                        @update:model-value="updateSetting(field.key, $event)" />
                </el-form-item>
            </div>
        </section>

        <section v-if="credentials.length" class="provider-section" aria-labelledby="provider-credential-heading">
            <header class="section-heading">
                <h3 id="provider-credential-heading">{{ label('credentials') }}</h3>
                <el-icon><Lock /></el-icon>
            </header>
            <p class="section-note">{{ t('alertConfig.credentialWriteNotice') }}</p>
            <p v-if="!canMaintainCredentials" class="section-note">{{ t('alertConfig.noCredentialPermission') }}</p>
            <div class="provider-grid">
                <el-form-item v-for="field in credentials" :key="field.key" :label="label(field.key)" :prop="'review.' + field.key"
                    :error="errors[field.key]" :required="tryingEnable && field.required && !isRegistered(field.key)">
                    <template #label>
                        <span>{{ label(field.key) }}</span>
                        <el-tag v-if="isRegistered(field.key)" size="small" type="success" effect="plain" class="credential-badge">
                            {{ label('registered') }}
                        </el-tag>
                    </template>
                    <el-input v-if="canMaintainCredentials && field.key === 'sshPrivateKey'" v-model="secretInputs[field.key]" :validate-event="false"
                        :aria-label="label(field.key)" type="textarea" class="masked-key" :rows="3" maxlength="16384"
                        autocomplete="off" spellcheck="false" :placeholder="secretPlaceholder(field.key)" @input="delete errors[field.key]" />
                    <el-input v-else-if="canMaintainCredentials" v-model="secretInputs[field.key]" :validate-event="false" :aria-label="label(field.key)"
                        type="password" maxlength="16384" autocomplete="new-password" spellcheck="false"
                        :placeholder="secretPlaceholder(field.key)" @input="delete errors[field.key]" />
                    <span v-else class="section-note">{{ isRegistered(field.key) ? label('registered') : label('unregistered') }}</span>
                </el-form-item>
            </div>
        </section>
        <el-alert v-if="Object.keys(errors).length" :title="label('completeFields')" type="error" :closable="false" show-icon />
    </div>
</template>

<script setup lang="ts">
import { Lock } from '@element-plus/icons-vue';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AlertPlatform, AlertProduct, AlertStatus, ProviderAccountConfig, ProviderAccountInput } from '@/api/channel/disputeAlert';
import AlertProductDisplay from '../dispute-alert/AlertProductDisplay.vue';
import { providerAccountFields, type ProviderAccountCode } from './provider-account-fields';

const props = defineProps<{
    code: ProviderAccountCode;
    platform: AlertPlatform;
    initialIdentifier: string;
    initialProducts: ProviderAccountInput['products'];
    existing?: ProviderAccountConfig | null;
    canMaintainCredentials: boolean;
}>();
const emit = defineEmits<{
    save: [input: ProviderAccountInput];
}>();

const { t } = useI18n();
const label = (key: string) => t('alertConfig.providerAccount.' + key);
const productName = (product: AlertProduct) => t('alertConfig.productLabel.' + product);
const optionLabel = (option: string) => /^(2025-04-01|v3|alerts\.)/.test(option) ? option : label(option);
const identifier = ref(props.initialIdentifier);
const registeredProducts = new Map(props.initialProducts.map(({ product, status }) => [product, status]));
const productStatuses = reactive(new Map(registeredProducts));
const selected = computed({
    get: () => [...productStatuses.keys()],
    set: (values: AlertProduct[]) => {
        const retained = new Set([...values, ...registeredProducts.keys()]);
        for (const product of retained) {
            if (!productStatuses.has(product)) productStatuses.set(product, 'DRAFT');
        }
        for (const product of productStatuses.keys()) {
            if (!retained.has(product)) productStatuses.delete(product);
        }
    },
});
const values = reactive<ProviderAccountConfig['values']>({ ...props.existing?.values });
const registered = new Set(props.existing?.registered);
const secretInputs = reactive<Record<string, string>>({});
const errors = ref<Record<string, string>>({});
const tryingEnable = ref(false);
const fields = computed(() => providerAccountFields(props.code, values));
const settings = computed(() => fields.value.filter((field) => field.kind !== 'secret'));
const credentials = computed(() => fields.value.filter((field) => field.kind === 'secret'));

function productStatus(product: AlertProduct) {
    return productStatuses.get(product) ?? 'DRAFT';
}

function productStatusType(product: AlertProduct) {
    const status = productStatus(product);
    return status === 'ENABLED' ? 'success' : status === 'DRAFT' ? 'warning' : 'info';
}

function productAction(product: AlertProduct) {
    return t(productStatus(product) === 'ENABLED' ? 'common.disable' : 'common.enable');
}

function canToggleProduct(product: AlertProduct) {
    return productStatus(product) === 'ENABLED' || Boolean(props.platform.products.find((item) => item.product === product)?.enabled);
}

function toggleProduct(product: AlertProduct) {
    productStatuses.set(product, productStatus(product) === 'ENABLED' ? 'DISABLED' : 'ENABLED');
}

function isRegistered(key: string) {
    return registered.has(key);
}

function secretPlaceholder(key: string) {
    return t(isRegistered(key) ? 'alertConfig.keepCredential' : 'common.pleaseInput');
}

function updateSetting(key: string, value: string | string[]) {
    values[key] = value;
    delete errors.value[key];
    if (key === 'apiVersion') {
        values.usage = [];
        values.webhookEvents = [];
    }
    if (key === 'deliveryMethod') values.authMethod = '';
    if (key === 'usage' && Array.isArray(value) && value.includes('api') && value.includes('signedApi')) {
        const last = value.at(-1);
        values.usage = value.filter((option) => option !== (last === 'signedApi' ? 'api' : 'signedApi'));
    }
    const visible = new Set(fields.value.map((field) => field.key));
    for (const key of Object.keys(errors.value)) {
        if (key !== 'identifier' && key !== 'products' && !visible.has(key)) delete errors.value[key];
    }
    for (const key of Object.keys(secretInputs)) {
        if (!visible.has(key)) delete secretInputs[key];
    }
}

function validHttps(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password && !value.includes('?') && !value.includes('#');
    } catch {
        return false;
    }
}

function submit(status: AlertStatus) {
    const enable = status === 'ENABLED';
    tryingEnable.value = enable;
    const nextErrors: Record<string, string> = {};
    if (!identifier.value.trim()) nextErrors.identifier = t('alertConfig.accountIdentifierRequired');
    if (!selected.value.length) nextErrors.products = t('alertConfig.accountProductRequired');
    for (const field of fields.value) {
        const value = values[field.key] ?? '';
        const present = field.kind === 'secret'
            ? isRegistered(field.key) || (props.canMaintainCredentials && !!secretInputs[field.key]?.trim())
            : (Array.isArray(value) ? value.length > 0 : !!value.trim());
        if (enable && field.required && !present) {
            nextErrors[field.key] = label('requiredForEnable');
        } else if (enable && field.kind === 'url' && present && !validHttps(String(value))) {
            nextErrors[field.key] = label('invalidHttps');
        }
    }
    errors.value = nextErrors;
    if (Object.keys(nextErrors).length) return 'review.' + Object.keys(nextErrors)[0];

    const inputs = props.canMaintainCredentials
        ? credentials.value.flatMap(({ key }) => secretInputs[key]?.trim() ? [[key, secretInputs[key].trim()]] : [])
        : [];
    const products = [...productStatuses].map(([product, productState]) => ({
        product,
        status: enable || productState !== 'ENABLED' ? productState : registeredProducts.get(product) ?? 'DRAFT' as const,
    }));
    const ordinaryFields = settings.value.filter(({ key }) => key in values);
    const ordinaryValues = Object.fromEntries(ordinaryFields.map(({ key }) =>
        [key, Array.isArray(values[key]) ? [...values[key]] : String(values[key]).trim()]));
    emit('save', {
        merchantNumber: identifier.value.trim(), products, status, settings: ordinaryValues,
        credentials: inputs.length ? Object.fromEntries(inputs) : undefined,
    });
    return undefined;
}

function clearCredentials() {
    for (const key of Object.keys(secretInputs)) delete secretInputs[key];
}

defineExpose({ submit, clearCredentials });
</script>

<style scoped>
.provider-review {
    display: grid;
    gap: 16px;
}
.provider-section {
    min-width: 0;
    padding: 16px 16px 0;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
}
.section-heading {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    color: var(--el-color-primary);
}
.section-heading h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 15px;
    font-weight: 600;
}
.section-note {
    margin: 0 0 10px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.55;
}
.provider-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
}
.provider-grid :deep(.el-form-item__label) {
    height: auto;
    white-space: normal;
}
.provider-grid :deep(.el-select) {
    width: 100%;
}
.product-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
}
.product-controls li {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 2px 8px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: var(--el-border-radius-base);
}
.credential-badge {
    margin-inline-start: 8px;
}
.masked-key :deep(textarea) {
    -webkit-text-security: disc;
}
@media (max-width: 620px) {
    .provider-section {
        padding-inline: 12px;
    }
    .provider-grid {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
