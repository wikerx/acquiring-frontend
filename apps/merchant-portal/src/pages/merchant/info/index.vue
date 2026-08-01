<template>
    <div class="page system-page merchant-redesigned-page merchant-info-page">
        <header class="merchant-info-header">
            <div class="merchant-info-header__identity">
                <span class="merchant-info-header__mark">
                    <el-icon><OfficeBuilding /></el-icon>
                </span>
                <div>
                    <h2>{{ profile?.merchantShortName || profile?.merchantName || t('merchantInfo.title') }}</h2>
                    <span>{{ profile?.merchantId || '-' }}</span>
                </div>
                <el-tag v-if="profile" :type="merchantStatusType(profile.merchantStatus)" effect="plain">
                    {{ merchantStatusText(profile.merchantStatus) }}
                </el-tag>
            </div>
            <el-tooltip :content="t('common.refresh')" placement="bottom">
                <el-button
                    circle
                    :icon="Refresh"
                    :aria-label="t('common.refresh')"
                    :loading="loading"
                    @click="loadProfile"
                />
            </el-tooltip>
        </header>

        <el-skeleton v-if="loading && !profile" :rows="8" animated />
        <el-empty v-else-if="!profile" :description="t('merchantInfo.empty')" />

        <template v-else>
            <section class="merchant-info-section merchant-info-section--readonly">
                <div class="merchant-info-section__head">
                    <div>
                        <h3>{{ t('merchantInfo.platformTitle') }}</h3>
                        <span>{{ t('merchantInfo.readOnly') }}</span>
                    </div>
                    <el-icon><Lock /></el-icon>
                </div>
                <el-descriptions :column="platformDescriptionColumns" border size="small">
                    <el-descriptions-item :label="t('merchantInfo.merchantId')">{{ profile.merchantId }}</el-descriptions-item>
                    <el-descriptions-item :label="t('merchantInfo.legalName')">{{ profile.merchantName }}</el-descriptions-item>
                    <el-descriptions-item :label="t('merchantInfo.status')">
                        <el-tag :type="merchantStatusType(profile.merchantStatus)" size="small">
                            {{ merchantStatusText(profile.merchantStatus) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="MCC">{{ profile.merchantCategoryCode || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('merchantInfo.country')">{{ profile.countryCode || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('merchantInfo.settlementCurrency')">{{ profile.settlementCurrency || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('merchantInfo.riskLevel')">{{ riskLevelText(profile.riskLevel) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('merchantInfo.createdAt')"><BaseDateTime :value="profile.gmtCreate" /></el-descriptions-item>
                    <el-descriptions-item :label="t('merchantInfo.updatedAt')"><BaseDateTime :value="profile.gmtModified" /></el-descriptions-item>
                </el-descriptions>
            </section>

            <el-form
                ref="formRef"
                :model="form"
                :rules="rules"
                label-position="top"
                :disabled="!canEdit"
                class="merchant-info-form"
            >
                <section class="merchant-info-section">
                    <div class="merchant-info-section__head">
                        <h3>{{ t('merchantInfo.businessTitle') }}</h3>
                        <el-icon><Shop /></el-icon>
                    </div>
                    <div class="merchant-info-form__grid">
                        <el-form-item :label="t('merchantInfo.billingDescriptor')" prop="billingDescriptor">
                            <el-input v-model="form.billingDescriptor" maxlength="64" show-word-limit />
                        </el-form-item>
                        <el-form-item :label="t('merchantInfo.shortName')" prop="merchantShortName">
                            <el-input v-model="form.merchantShortName" maxlength="64" show-word-limit />
                        </el-form-item>
                        <el-form-item :label="t('merchantInfo.region')" prop="regionCode">
                            <el-input v-model="form.regionCode" maxlength="64" />
                        </el-form-item>
                        <el-form-item :label="t('merchantInfo.city')" prop="city">
                            <el-input v-model="form.city" maxlength="128" />
                        </el-form-item>
                        <el-form-item :label="t('merchantInfo.postalCode')" prop="postalCode">
                            <el-input v-model="form.postalCode" maxlength="32" />
                        </el-form-item>
                        <el-form-item :label="t('merchantInfo.timezone')" prop="timezone">
                            <el-select
                                v-model="form.timezone"
                                filterable
                                allow-create
                                default-first-option
                                :placeholder="t('merchantInfo.timezonePlaceholder')"
                            >
                                <el-option v-for="timezone in commonTimezones" :key="timezone" :label="timezone" :value="timezone" />
                            </el-select>
                        </el-form-item>
                        <el-form-item class="merchant-info-form__wide" :label="t('merchantInfo.address')" prop="addressLine">
                            <el-input v-model="form.addressLine" maxlength="255" show-word-limit />
                        </el-form-item>
                    </div>
                </section>

                <section class="merchant-info-section">
                    <div class="merchant-info-section__head">
                        <h3>{{ t('merchantInfo.contactTitle') }}</h3>
                        <el-icon><User /></el-icon>
                    </div>
                    <div class="merchant-info-form__grid merchant-info-form__grid--three">
                        <el-form-item :label="t('merchantInfo.contactName')" prop="contactName">
                            <el-input v-model="form.contactName" maxlength="128" />
                        </el-form-item>
                        <el-form-item :label="t('merchantInfo.contactEmail')" prop="contactEmail">
                            <el-input v-model="form.contactEmail" maxlength="128" />
                        </el-form-item>
                        <el-form-item :label="t('merchantInfo.contactPhone')" prop="contactPhone">
                            <el-input v-model="form.contactPhone" maxlength="32" />
                        </el-form-item>
                    </div>
                </section>

                <div v-if="canEdit" class="merchant-info-actions">
                    <el-button :icon="RefreshLeft" :disabled="saving || !isDirty" @click="resetForm">
                        {{ t('common.reset') }}
                    </el-button>
                    <el-button type="primary" :icon="Check" :loading="saving" :disabled="!isDirty" @click="saveProfile">
                        {{ t('common.save') }}
                    </el-button>
                </div>
            </el-form>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Check, Lock, OfficeBuilding, Refresh, RefreshLeft, Shop, User } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { merchantInfoApi, type MerchantProfile, type MerchantProfileUpdatePayload } from '@/api/merchantInfoApi';
import { hasPermission } from '@/utils/permission';

const { t } = useI18n();
const formRef = ref<FormInstance>();
const profile = ref<MerchantProfile>();
const loading = ref(false);
const saving = ref(false);
const originalForm = ref('');
const platformDescriptionColumns = ref(3);
const canEdit = hasPermission('merchant:info:edit');
const commonTimezones = [
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'UTC',
];

const form = reactive<MerchantProfileUpdatePayload>({
    billingDescriptor: '',
    merchantShortName: '',
    regionCode: '',
    city: '',
    addressLine: '',
    postalCode: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    timezone: '',
});

const rules = computed<FormRules<MerchantProfileUpdatePayload>>(() => ({
    billingDescriptor: [
        { required: true, message: t('merchantInfo.billingRequired'), trigger: 'blur' },
        { validator: validateBillingDescriptor, trigger: 'blur' },
    ],
    merchantShortName: [{ required: true, message: t('merchantInfo.shortNameRequired'), trigger: 'blur' }],
    contactEmail: [
        { required: true, message: t('merchantInfo.emailRequired'), trigger: 'blur' },
        { type: 'email', message: t('merchantInfo.emailInvalid'), trigger: 'blur' },
    ],
    timezone: [
        { required: true, message: t('merchantInfo.timezoneRequired'), trigger: 'change' },
        { validator: validateTimezone, trigger: 'change' },
    ],
}));

const isDirty = computed(() => JSON.stringify(normalizedForm()) !== originalForm.value);

/** Loads only the authenticated merchant's profile; the API does not accept a merchant identifier. */
async function loadProfile() {
    loading.value = true;
    try {
        const latest = await merchantInfoApi.getProfile();
        profile.value = latest;
        applyProfile(latest);
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.loadFailed'));
    } finally {
        loading.value = false;
    }
}

/** Saves the allowed fields, then re-queries the backend to verify the committed shared-cache view. */
async function saveProfile() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid || !isDirty.value) {
        return;
    }
    saving.value = true;
    try {
        await merchantInfoApi.updateProfile(normalizedForm());
        await loadProfile();
        ElMessage.success(t('merchantInfo.saveSuccess'));
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.saveFailed'));
    } finally {
        saving.value = false;
    }
}

function applyProfile(value: MerchantProfile) {
    form.billingDescriptor = value.billingDescriptor || '';
    form.merchantShortName = value.merchantShortName || '';
    form.regionCode = value.regionCode || '';
    form.city = value.city || '';
    form.addressLine = value.addressLine || '';
    form.postalCode = value.postalCode || '';
    form.contactName = value.contactName || '';
    form.contactEmail = value.contactEmail || '';
    form.contactPhone = value.contactPhone || '';
    form.timezone = value.timezone || '';
    originalForm.value = JSON.stringify(normalizedForm());
    formRef.value?.clearValidate();
}

function resetForm() {
    if (profile.value) {
        applyProfile(profile.value);
    }
}

function normalizedForm(): MerchantProfileUpdatePayload {
    return {
        billingDescriptor: form.billingDescriptor.trim(),
        merchantShortName: form.merchantShortName.trim(),
        regionCode: trimToNull(form.regionCode),
        city: trimToNull(form.city),
        addressLine: trimToNull(form.addressLine),
        postalCode: trimToNull(form.postalCode),
        contactName: trimToNull(form.contactName),
        contactEmail: form.contactEmail.trim(),
        contactPhone: trimToNull(form.contactPhone),
        timezone: form.timezone.trim(),
    };
}

function trimToNull(value?: string | null) {
    return value?.trim() || null;
}

function validateBillingDescriptor(_rule: unknown, value: string, callback: (error?: Error) => void) {
    callback(/^[\x20-\x7E]{1,64}$/.test(value || '') ? undefined : new Error(t('merchantInfo.billingInvalid')));
}

function validateTimezone(_rule: unknown, value: string, callback: (error?: Error) => void) {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
        callback();
    } catch {
        callback(new Error(t('merchantInfo.timezoneInvalid')));
    }
}

function merchantStatusText(status?: number) {
    if (status === 1) return t('merchantInfo.statusActive');
    if (status === 2) return t('merchantInfo.statusFrozen');
    if (status === 3) return t('merchantInfo.statusClosed');
    return t('merchantInfo.statusUnknown');
}

function merchantStatusType(status?: number) {
    if (status === 1) return 'success';
    if (status === 2) return 'warning';
    return 'info';
}

function riskLevelText(level?: number) {
    if (level === 1) return t('merchantInfo.riskLow');
    if (level === 2) return t('merchantInfo.riskNormal');
    if (level === 3) return t('merchantInfo.riskHigh');
    return '-';
}

/** Reduces read-only field columns with the viewport so merchant metadata remains readable without page-level clipping. */
function syncPlatformDescriptionColumns() {
    if (window.innerWidth <= 640) {
        platformDescriptionColumns.value = 1;
        return;
    }
    platformDescriptionColumns.value = window.innerWidth <= 980 ? 2 : 3;
}

onMounted(() => {
    syncPlatformDescriptionColumns();
    window.addEventListener('resize', syncPlatformDescriptionColumns);
    void loadProfile();
});

onBeforeUnmount(() => window.removeEventListener('resize', syncPlatformDescriptionColumns));
</script>

<style scoped>
.merchant-info-page {
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
}

.merchant-info-header {
    min-height: 74px;
    margin-bottom: 16px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border: 1px solid var(--merchant-border);
    border-radius: 6px;
    background: #ffffff;
    box-shadow: var(--merchant-card-shadow-soft);
}

.merchant-info-header__identity {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.merchant-info-header__identity h2 {
    margin: 0;
    color: var(--merchant-ink);
    font-size: 18px;
    line-height: 1.35;
    letter-spacing: 0;
}

.merchant-info-header__identity span {
    color: var(--merchant-muted);
    font-size: 12px;
}

.merchant-info-header__mark {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    color: #075985;
    background: #e0f2fe;
    font-size: 20px;
}

.merchant-info-section {
    min-width: 0;
    margin-bottom: 16px;
    padding: 18px;
    border: 1px solid var(--merchant-border);
    border-radius: 6px;
    background: #ffffff;
    box-shadow: var(--merchant-card-shadow-soft);
}

.merchant-info-section--readonly {
    border-top: 3px solid #0d9488;
}

.merchant-info-section__head {
    min-height: 28px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #0f766e;
}

.merchant-info-section__head h3 {
    margin: 0;
    color: var(--merchant-ink);
    font-size: 15px;
    line-height: 1.4;
    letter-spacing: 0;
}

.merchant-info-section__head span {
    color: var(--merchant-muted);
    font-size: 12px;
}

.merchant-info-form__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 20px;
}

.merchant-info-form__grid--three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.merchant-info-form__wide {
    grid-column: 1 / -1;
}

.merchant-info-actions {
    position: sticky;
    bottom: 16px;
    z-index: 4;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 16px;
    border: 1px solid var(--merchant-border);
    border-radius: 6px;
    background: rgb(255 255 255 / 96%);
    box-shadow: 0 10px 28px rgb(15 23 42 / 10%);
}

.merchant-info-form :deep(.el-select) {
    width: 100%;
}

@media (max-width: 980px) {
    .merchant-info-form__grid--three {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .merchant-info-section :deep(.el-descriptions__body) {
        overflow-x: auto;
    }
}

@media (max-width: 640px) {
    .merchant-info-header {
        align-items: flex-start;
    }

    .merchant-info-header__identity {
        flex-wrap: wrap;
    }

    .merchant-info-form__grid,
    .merchant-info-form__grid--three {
        grid-template-columns: minmax(0, 1fr);
    }

    .merchant-info-actions {
        bottom: 8px;
    }
}
</style>
