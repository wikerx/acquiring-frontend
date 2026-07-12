<template>
    <div class="user-profile-page">
        <section class="profile-info-card">
            <div class="profile-card__header">{{ t('userProfile.infoTitle') }}</div>
            <div class="profile-info-card__avatar-block">
                <span class="profile-info-card__avatar" :aria-label="t('userProfile.avatarAlt')">{{ avatarText }}</span>
                <strong>{{ displayName }}</strong>
                <small>{{ account?.loginAccount || '-' }}</small>
            </div>
            <dl class="profile-info-list">
                <div v-for="item in infoItems" :key="item.label" class="profile-info-list__item">
                    <dt>
                        <el-icon><component :is="item.icon" /></el-icon>
                        <span>{{ item.label }}</span>
                    </dt>
                    <dd>{{ item.value || '-' }}</dd>
                </div>
            </dl>
        </section>

        <section class="profile-form-card">
            <div class="profile-card__header">{{ t('userProfile.basicTitle') }}</div>
            <el-tabs v-model="activeTab" class="profile-tabs">
                <el-tab-pane :label="t('userProfile.basicTab')" name="basic">
                    <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-width="96px" class="profile-form">
                        <el-form-item :label="t('userProfile.nickname')" prop="nickname">
                            <el-input v-model.trim="basicForm.nickname" />
                        </el-form-item>
                        <el-form-item :label="t('userProfile.mobile')" prop="mobile">
                            <el-input v-model.trim="basicForm.mobile" :placeholder="t('common.pleaseInput')" />
                        </el-form-item>
                        <el-form-item :label="t('userProfile.email')" prop="email">
                            <el-input v-model.trim="basicForm.email" :placeholder="t('common.pleaseInput')" />
                        </el-form-item>
                        <el-form-item :label="t('userProfile.gender')">
                            <el-radio-group v-model="basicForm.gender">
                                <el-radio value="male">{{ t('userProfile.male') }}</el-radio>
                                <el-radio value="female">{{ t('userProfile.female') }}</el-radio>
                                <el-radio value="unknown">{{ t('userProfile.unknown') }}</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="handleSaveBasic">{{ t('common.save') }}</el-button>
                            <el-button @click="router.back()">{{ t('common.close') }}</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
                <el-tab-pane :label="t('userProfile.passwordTab')" name="password">
                    <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="96px" class="profile-form">
                        <el-form-item :label="t('userProfile.oldPassword')" prop="oldPassword">
                            <el-input v-model.trim="passwordForm.oldPassword" type="password" show-password :placeholder="t('userProfile.oldPasswordPlaceholder')" />
                        </el-form-item>
                        <el-form-item :label="t('userProfile.newPassword')" prop="newPassword">
                            <el-input v-model.trim="passwordForm.newPassword" type="password" show-password :placeholder="t('userProfile.newPasswordPlaceholder')" />
                        </el-form-item>
                        <el-form-item :label="t('userProfile.confirmPassword')" prop="confirmPassword">
                            <el-input v-model.trim="passwordForm.confirmPassword" type="password" show-password :placeholder="t('userProfile.confirmPasswordPlaceholder')" />
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
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Calendar, CollectionTag, Iphone, Message, OfficeBuilding, User, UserFilled } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/store/modules/user';

const router = useRouter();
const userStore = useUserStore();
const { t } = useI18n();

const activeTab = ref('basic');
const basicFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const account = computed(() => userStore.account);
const displayName = computed(() => account.value?.realName?.trim() || account.value?.loginAccount?.trim() || 'Admin');
const avatarText = computed(() => buildAvatarText(displayName.value));
const profileSources = computed(() => collectProfileSources(account.value));
const roleText = computed(() => buildRoleText(userStore.roles, profileSources.value));
const mobileText = computed(() => readProfileField(['mobile', 'phone', 'phoneNumber', 'telephone', 'tel']));
const emailText = computed(() => readProfileField(['email', 'mail', 'emailAddress', 'userEmail']));
const deptText = computed(() => readProfileField(['deptName', 'departmentName', 'dept', 'department']));
const createTimeText = computed(() => readProfileField(['createdAt', 'createTime', 'createdTime', 'gmtCreate']));

const basicForm = reactive({
    nickname: '',
    mobile: '',
    email: '',
    gender: 'unknown',
});

const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
});

const basicRules = computed<FormRules>(() => ({
    nickname: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    email: [
        { required: true, message: t('userProfile.emailRequired'), trigger: 'blur' },
        { type: 'email', message: t('userProfile.emailFormat'), trigger: 'blur' },
    ],
}));

const passwordRules = computed<FormRules>(() => ({
    oldPassword: [{ required: true, message: t('userProfile.oldPasswordPlaceholder'), trigger: 'blur' }],
    newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
    confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
}));

const infoItems = computed(() => [
    { label: t('userProfile.userName'), value: displayName.value, icon: User },
    { label: t('userProfile.loginAccount'), value: account.value?.loginAccount, icon: UserFilled },
    { label: t('userProfile.mobile'), value: mobileText.value, icon: Iphone },
    { label: t('userProfile.email'), value: emailText.value, icon: Message },
    { label: t('userProfile.dept'), value: deptText.value, icon: OfficeBuilding },
    { label: t('userProfile.role'), value: roleText.value, icon: CollectionTag },
    { label: t('userProfile.createTime'), value: createTimeText.value, icon: Calendar },
    { label: t('userProfile.appCode'), value: account.value?.appCode, icon: CollectionTag },
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

async function handleSaveBasic() {
    const valid = await basicFormRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    ElMessage.info(t('userProfile.localSaveOnly'));
}

async function handleSavePassword() {
    const valid = await passwordFormRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    ElMessage.info(t('userProfile.passwordApiPending'));
}

function validateNewPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) {
        callback(new Error(t('userProfile.newPasswordPlaceholder')));
        return;
    }
    if (value.length < 8) {
        callback(new Error(t('userProfile.passwordLength')));
        return;
    }
    if (value === passwordForm.oldPassword) {
        callback(new Error(t('userProfile.passwordSame')));
        return;
    }
    callback();
}

function validateConfirmPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) {
        callback(new Error(t('userProfile.confirmPasswordPlaceholder')));
        return;
    }
    if (value !== passwordForm.newPassword) {
        callback(new Error(t('userProfile.passwordMismatch')));
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
        ADMIN_OPERATOR: '管理员',
        SUPER_ADMIN: '超级管理员',
        ROLE_TEST: '测试角色',
    };
    if (presetLabels[normalized]) {
        return presetLabels[normalized];
    }
    const zhWordMap: Record<string, string> = {
        ADMIN: '管理',
        OPERATOR: '员',
        AUDIT: '审计',
        FINANCE: '财务',
        MANAGER: '经理',
        MERCHANT: '商户',
        PAYMENT: '支付',
        REVIEW: '审核',
        RISK: '风控',
        SUPPORT: '支持',
        SYSTEM: '系统',
        TEST: '测试',
        VIEW: '查看',
    };
    const words = normalized.replace(/^ROLE_/, '').split('_').filter(Boolean);
    const translated = words.map((word) => zhWordMap[word] || '');
    if (translated.length && translated.every(Boolean)) {
        const joined = translated.join('');
        return /员$|经理$/.test(joined) ? joined : `${joined}角色`;
    }
    return words.map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
}

function buildAvatarText(value: string) {
    const source = value.trim();
    if (!source) {
        return 'A';
    }
    const first = source.charAt(0);
    return /^[A-Za-z]/.test(first) ? first.toUpperCase() : first;
}
</script>

<style scoped>
.user-profile-page {
    display: grid;
    grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
    gap: 16px;
    min-height: calc(100vh - 90px);
    padding: 16px;
    background: #f5f7fb;
}

.profile-info-card,
.profile-form-card {
    background: #fff;
    border: 1px solid #e6eaf2;
    border-radius: 6px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.profile-card__header {
    min-height: 42px;
    padding: 0 16px;
    border-bottom: 1px solid #e6eaf2;
    color: #303133;
    font-size: 15px;
    font-weight: 600;
    line-height: 42px;
}

.profile-info-card__avatar-block {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 24px 20px 18px;
}

.profile-info-card__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 92px;
    height: 92px;
    color: #fff;
    background: linear-gradient(135deg, var(--app-primary), #1d4ed8);
    border-radius: 50%;
    font-size: 34px;
    font-weight: 800;
    box-shadow: 0 18px 30px rgba(37, 99, 235, 0.24);
}

.profile-info-card__avatar-block strong {
    color: #101828;
    font-size: 16px;
}

.profile-info-card__avatar-block small {
    color: #667085;
}

.profile-info-list {
    margin: 0;
    padding: 0 18px 18px;
}

.profile-info-list__item {
    display: grid;
    grid-template-columns: minmax(100px, 0.9fr) minmax(0, 1fr);
    gap: 12px;
    min-height: 36px;
    align-items: center;
    border-bottom: 1px solid #f0f2f5;
}

.profile-info-list__item dt,
.profile-info-list__item dd {
    min-width: 0;
    margin: 0;
}

.profile-info-list__item dt {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #606266;
}

.profile-info-list__item dd {
    color: #303133;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.profile-tabs {
    padding: 12px 18px 20px;
}

.profile-form {
    max-width: 760px;
    padding-top: 8px;
}

@media (max-width: 900px) {
    .user-profile-page {
        grid-template-columns: 1fr;
    }
}
</style>
