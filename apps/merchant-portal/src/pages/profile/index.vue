<template>
    <div class="merchant-profile-page">
        <section class="merchant-profile-info">
            <div class="merchant-profile-card__header">{{ t('profile.infoTitle') }}</div>
            <div class="merchant-profile-info__identity">
                <span class="merchant-profile-info__avatar" :aria-label="t('profile.avatarAlt')">{{ avatarText }}</span>
                <strong>{{ displayName }}</strong>
                <small>{{ account?.loginAccount || '-' }}</small>
            </div>
            <dl class="merchant-profile-info__list">
                <div v-for="item in infoItems" :key="item.label" class="merchant-profile-info__item">
                    <dt>
                        <el-icon><component :is="item.icon" /></el-icon>
                        <span>{{ item.label }}</span>
                    </dt>
                    <dd>{{ item.value || '-' }}</dd>
                </div>
            </dl>
        </section>

        <section class="merchant-profile-panel">
            <div class="merchant-profile-card__header">{{ t('profile.basicTitle') }}</div>
            <el-tabs v-model="activeTab" class="merchant-profile-tabs">
                <el-tab-pane :label="t('profile.basicTab')" name="basic">
                    <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-width="96px" class="merchant-profile-form">
                        <el-form-item :label="t('profile.nickname')" prop="nickname">
                            <el-input v-model.trim="basicForm.nickname" />
                        </el-form-item>
                        <el-form-item :label="t('profile.mobile')" prop="mobile">
                            <el-input v-model.trim="basicForm.mobile" :placeholder="t('common.pleaseInput')" />
                        </el-form-item>
                        <el-form-item :label="t('profile.email')" prop="email">
                            <el-input v-model.trim="basicForm.email" :placeholder="t('common.pleaseInput')" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="handleSaveBasic">{{ t('common.save') }}</el-button>
                            <el-button @click="router.back()">{{ t('common.close') }}</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
                <el-tab-pane :label="t('profile.passwordTab')" name="password">
                    <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="96px" class="merchant-profile-form">
                        <el-form-item :label="t('profile.oldPassword')" prop="oldPassword">
                            <el-input v-model.trim="passwordForm.oldPassword" type="password" show-password :placeholder="t('profile.oldPasswordPlaceholder')" />
                        </el-form-item>
                        <el-form-item :label="t('profile.newPassword')" prop="newPassword">
                            <el-input v-model.trim="passwordForm.newPassword" type="password" show-password :placeholder="t('profile.newPasswordPlaceholder')" />
                        </el-form-item>
                        <el-form-item :label="t('profile.confirmPassword')" prop="confirmPassword">
                            <el-input v-model.trim="passwordForm.confirmPassword" type="password" show-password :placeholder="t('profile.confirmPasswordPlaceholder')" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="handleSavePassword">{{ t('common.save') }}</el-button>
                            <el-button @click="router.back()">{{ t('common.close') }}</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Calendar, CollectionTag, Iphone, Message, OfficeBuilding, User, UserFilled } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { changePassword, currentUser, updateProfile } from '@/api/authApi';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const activeTab = ref('basic');
const basicFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const account = computed(() => auth.session?.account);
const displayName = computed(() => account.value?.nickname?.trim() || account.value?.realName?.trim() || account.value?.loginAccount?.trim() || t('layout.fallbackMerchant'));
const avatarText = computed(() => buildAvatarText(displayName.value));
const profileSources = computed(() => collectProfileSources(account.value));
const roleText = computed(() => buildRoleText(auth.session?.roles || [], profileSources.value));
const mobileText = computed(() => readProfileField(['mobile', 'phone', 'phoneNumber', 'telephone', 'tel']));
const emailText = computed(() => readProfileField(['email', 'mail', 'emailAddress', 'userEmail']));
const createTimeText = computed(() => readProfileField(['createdAt', 'createTime', 'createdTime', 'gmtCreate']));

const basicForm = reactive({
    nickname: '',
    mobile: '',
    email: '',
});

const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
});

const basicRules = computed<FormRules>(() => ({
    nickname: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    email: [
        { required: true, message: t('profile.emailRequired'), trigger: 'blur' },
        { type: 'email', message: t('profile.emailFormat'), trigger: 'blur' },
    ],
}));

const passwordRules = computed<FormRules>(() => ({
    oldPassword: [{ required: true, message: t('profile.oldPasswordPlaceholder'), trigger: 'blur' }],
    newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
    confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
}));

const infoItems = computed(() => [
    { label: t('profile.userName'), value: displayName.value, icon: User },
    { label: t('profile.loginAccount'), value: account.value?.loginAccount, icon: UserFilled },
    { label: t('profile.merchantId'), value: account.value?.merchantId, icon: OfficeBuilding },
    { label: t('profile.mobile'), value: mobileText.value, icon: Iphone },
    { label: t('profile.email'), value: emailText.value, icon: Message },
    { label: t('profile.role'), value: roleText.value, icon: CollectionTag },
    { label: t('profile.createTime'), value: createTimeText.value, icon: Calendar },
    { label: t('profile.appCode'), value: account.value?.appCode, icon: CollectionTag },
]);

watch(
    account,
    () => {
        basicForm.nickname = displayName.value;
        basicForm.mobile = mobileText.value;
        basicForm.email = emailText.value;
    },
    { immediate: true },
);

onMounted(() => {
    void refreshProfileIfMissing();
});

async function refreshProfileIfMissing() {
    if (!auth.session || hasCompleteProfileSnapshot()) {
        return;
    }
    try {
        const response = await currentUser();
        auth.setCurrentUserResponse(response);
    } catch {
        // Keep the cached session available when the profile refresh is blocked by a transient request failure.
    }
}

function hasCompleteProfileSnapshot() {
    return Boolean(mobileText.value && emailText.value && roleText.value !== '-');
}

async function handleSaveBasic() {
    const valid = await basicFormRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    const response = await updateProfile({
        nickname: basicForm.nickname,
        mobile: basicForm.mobile || null,
        email: basicForm.email,
    });
    auth.setCurrentUserResponse(response);
    ElMessage.success(t('profile.profileSaveSuccess'));
}

async function handleSavePassword() {
    const valid = await passwordFormRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
    });
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordFormRef.value?.clearValidate();
    ElMessage.success(t('profile.passwordSaveSuccess'));
}

function validateNewPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) {
        callback(new Error(t('profile.newPasswordPlaceholder')));
        return;
    }
    if (value.length < 8) {
        callback(new Error(t('profile.passwordLength')));
        return;
    }
    if (value === passwordForm.oldPassword) {
        callback(new Error(t('profile.passwordSame')));
        return;
    }
    callback();
}

function validateConfirmPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) {
        callback(new Error(t('profile.confirmPasswordPlaceholder')));
        return;
    }
    if (value !== passwordForm.newPassword) {
        callback(new Error(t('profile.passwordMismatch')));
        return;
    }
    callback();
}

function readProfileField(fields: string[]) {
    for (const source of profileSources.value) {
        for (const field of fields) {
            const value = source[field];
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
            if (typeof value === 'number') {
                return String(value);
            }
        }
    }
    return '';
}

function collectProfileSources(source: unknown): Record<string, unknown>[] {
    const root = toRecord(source);
    if (!root) {
        return [];
    }
    return [
        root,
        toRecord(root.account),
        toRecord(root.user),
        toRecord(root.userInfo),
        toRecord(root.currentUser),
        toRecord(root.profile),
    ].filter((item): item is Record<string, unknown> => Boolean(item));
}

function toRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function buildRoleText(sessionRoles: string[], sources: Record<string, unknown>[]) {
    const roleLabels = [
        ...extractRoleLabelsFromSources(sources),
        ...sessionRoles.map((role) => formatRoleLabel(role)),
    ].filter(Boolean);
    return Array.from(new Set(roleLabels)).join(' / ') || '-';
}

function extractRoleLabelsFromSources(sources: Record<string, unknown>[]) {
    const labels: string[] = [];
    for (const source of sources) {
        labels.push(...stringArray(source.roleNames));
        labels.push(...stringArray(source.roleNameList));
        labels.push(...stringArray(source.roleName));
        labels.push(...stringArray(source.roles).map((item) => formatRoleLabel(item)));
    }
    return labels.map((item) => item.trim()).filter(Boolean);
}

function stringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
    return typeof value === 'string' && value.trim() ? [value] : [];
}

function formatRoleLabel(roleCode: string) {
    const normalized = roleCode.trim().replace(/[\s-]+/g, '_').replace(/^RO+LE_/, 'ROLE_').toUpperCase();
    const presetLabels: Record<string, string> = {
        MERCHANT_ADMIN: t('layout.merchantAdmin'),
        ROLE_MERCHANT_ADMIN: t('layout.merchantAdmin'),
        MERCHANT_OPERATOR: t('layout.merchantOperator'),
        ROLE_MERCHANT_OPERATOR: t('layout.merchantOperator'),
    };
    if (presetLabels[normalized]) {
        return presetLabels[normalized];
    }
    return normalized.replace(/^ROLE_/, '').split('_').filter(Boolean)
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}

function buildAvatarText(value: string) {
    const source = value.trim();
    if (!source) {
        return 'M';
    }
    const first = source.charAt(0);
    return /^[A-Za-z]/.test(first) ? first.toUpperCase() : first;
}
</script>

<style scoped>
.merchant-profile-page {
    display: grid;
    grid-template-columns: minmax(260px, 350px) minmax(0, 1fr);
    gap: 16px;
}

.merchant-profile-info,
.merchant-profile-panel {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    box-shadow: 0 10px 24px rgb(15 23 42 / 5%);
}

.merchant-profile-card__header {
    min-height: 42px;
    padding: 0 16px;
    border-bottom: 1px solid #e4e7ed;
    color: #101828;
    font-size: 15px;
    font-weight: 700;
    line-height: 42px;
}

.merchant-profile-info__identity {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 24px 20px 18px;
}

.merchant-profile-info__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 92px;
    height: 92px;
    color: #fff;
    background: linear-gradient(135deg, var(--merchant-teal), var(--merchant-primary-deep));
    border-radius: 50%;
    font-size: 34px;
    font-weight: 800;
    box-shadow: 0 18px 30px rgb(14 116 144 / 24%);
}

.merchant-profile-info__identity strong {
    color: #101828;
    font-size: 16px;
}

.merchant-profile-info__identity small {
    color: #667085;
}

.merchant-profile-info__list {
    margin: 0;
    padding: 0 18px 18px;
}

.merchant-profile-info__item {
    display: grid;
    grid-template-columns: minmax(100px, 0.9fr) minmax(0, 1fr);
    gap: 12px;
    min-height: 36px;
    align-items: center;
    border-bottom: 1px solid #edf1f5;
}

.merchant-profile-info__item dt,
.merchant-profile-info__item dd {
    min-width: 0;
    margin: 0;
}

.merchant-profile-info__item dt {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #606266;
}

.merchant-profile-info__item dd {
    color: #303133;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.merchant-profile-tabs {
    padding: 12px 18px 20px;
}

.merchant-profile-form {
    max-width: 760px;
    padding-top: 8px;
}

@media (max-width: 900px) {
    .merchant-profile-page {
        grid-template-columns: 1fr;
    }
}
</style>
