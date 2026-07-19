<template>
    <div class="page system-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form">
            <el-form-item :label="t('system.account.keyword')"><el-input v-model="query.keyword" :placeholder="t('system.account.keywordPlaceholder')" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item :label="t('system.account.role')"><el-select v-model="query.roleId" class="search-form__select--wide" :placeholder="t('common.all')" clearable><el-option v-for="role in roles" :key="role.roleId" :label="role.roleName" :value="role.roleId" /></el-select></el-form-item>
            <el-form-item :label="t('common.status')"><el-select v-model="query.status" :placeholder="t('common.all')" clearable><el-option :label="t('common.enabled')" :value="1" /><el-option :label="t('common.disabled')" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <div class="toolbar">
            <el-button v-if="canAdd" type="primary" plain size="small" :icon="Plus" @click="openForm()">{{ t('system.account.addEmployee') }}</el-button>
            <div class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></div>
        </div>
        <StandardTable table-key="merchant-system-account" v-loading="loading" :data="rows" row-key="accountId" size="small">
            <el-table-column prop="loginAccount" :label="t('system.account.loginAccount')" min-width="160" />
            <el-table-column prop="realName" :label="t('system.account.realName')" min-width="140" />
            <el-table-column prop="mobile" :label="t('system.account.mobile')" min-width="140" />
            <el-table-column prop="email" :label="t('system.account.email')" min-width="180" />
            <el-table-column :label="t('system.account.role')" min-width="180"><template #default="{ row }">{{ row.roleNames?.join(', ') || '-' }}</template></el-table-column>
            <el-table-column :label="t('system.account.mfaPolicy')" min-width="120" align="center">
                <template #default="{ row }">
                    <el-tag size="small" :type="mfaPolicyTag(row.mfaPolicy)" effect="plain">{{ mfaPolicyText(row.mfaPolicy) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="t('system.account.mfaStatus')" min-width="130" align="center">
                <template #default="{ row }">
                    <el-tag size="small" :type="mfaStatusTag(row.mfaStatus)" effect="plain">{{ mfaStatusText(row.mfaStatus) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="t('common.status')" width="100" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? t('common.enabled') : t('common.disabled') }}</el-tag></template></el-table-column>
            <el-table-column :label="t('system.role.createdTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.createdAt" /></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="120" align="center">
                <template #default="{ row }">
                    <div class="account-operation-group">
                        <el-dropdown v-if="hasActionMenu" trigger="click" @command="(command: string) => handleAccountCommand(command, row)">
                            <el-button size="small" link type="primary">
                                {{ t('system.account.actionMenu') }}
                                <el-icon class="el-icon--right"><MoreFilled /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item v-if="canEdit || canAssignRole" command="edit">{{ t('common.edit') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canResetPassword && !row.currentAccount" command="resetPassword" :divided="canEdit || canAssignRole">{{ t('system.account.resetPassword') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="row.currentAccount && canResetPassword" disabled :divided="canEdit || canAssignRole">{{ t('system.account.passwordSelfProtected') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canMfaRequire" command="mfaRequire" :divided="hasPasswordActions || canEdit || canAssignRole">{{ t('system.account.mfaRequire') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canMfaReset && !row.currentAccount" command="mfaReset">{{ t('system.account.mfaReset') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canMfaUnlock" command="mfaUnlock">{{ t('system.account.mfaUnlock') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canMfaResend" command="mfaResend">{{ t('system.account.mfaResend') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canMfaExempt && !row.currentAccount" command="mfaExempt">{{ t('system.account.mfaExempt') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canMfaDisable && !row.currentAccount" command="mfaDisable">{{ t('system.account.mfaDisable') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="row.currentAccount && hasSelfProtectedMfaActions" disabled>{{ t('system.account.mfaSelfProtected') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canChangeStatus" command="status" :divided="hasMfaActions">{{ row.status === 1 ? t('common.disabled') : t('common.enabled') }}</el-dropdown-item>
                                    <el-dropdown-item v-if="canDelete" command="delete" divided>{{ t('common.delete') }}</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                        <span v-if="!hasActionMenu">-</span>
                    </div>
                </template>
            </el-table-column>
        </StandardTable>
        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>
        <el-dialog v-model="visible" :title="form.accountId ? t('system.account.editEmployee') : t('system.account.addEmployee')" width="560px">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
                <el-form-item :label="t('system.account.loginAccount')" prop="loginAccount"><el-input v-model="form.loginAccount" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item v-if="!form.accountId" :label="t('system.account.initialPassword')" prop="password"><el-input v-model="form.password" type="password" show-password /></el-form-item>
                <el-form-item :label="t('system.account.realName')" prop="realName"><el-input v-model="form.realName" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item :label="t('system.account.mobile')"><el-input v-model="form.mobile" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item :label="t('system.account.email')" prop="email"><el-input v-model="form.email" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item :label="t('system.account.role')"><el-select v-model="form.roleIds" multiple style="width:100%" :disabled="!canAssignRole"><el-option v-for="role in roles" :key="role.roleId" :label="role.roleName" :value="role.roleId" /></el-select></el-form-item>
                <el-form-item :label="t('system.account.dept')"><el-tree-select v-model="form.deptIds" multiple :data="deptTree" node-key="deptId" :props="{ label: 'deptName', value: 'deptId', children: 'children' }" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item :label="t('system.account.post')"><el-select v-model="form.postIds" multiple style="width:100%" :disabled="!canSaveAccountBase"><el-option v-for="post in posts" :key="post.postId" :label="post.postName" :value="post.postId" /></el-select></el-form-item>
                <el-form-item :label="t('common.status')"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" :disabled="!canSaveAccountBase && !canChangeStatus" /></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button v-if="canSaveAccountBase || canAssignRole" type="primary" size="small" @click="submit">{{ t('common.save') }}</el-button><el-button size="small" @click="visible = false">{{ t('common.cancel') }}</el-button></div></template>
        </el-dialog>
        <el-dialog v-model="resetPasswordVisible" :title="t('system.account.resetPasswordTitle')" width="520px" destroy-on-close>
            <el-alert class="reset-password-alert" :title="t('system.account.resetPasswordTip')" type="warning" show-icon :closable="false" />
            <el-form ref="resetPasswordFormRef" :model="resetPasswordForm" :rules="resetPasswordRules" label-width="96px">
                <el-form-item :label="t('system.account.loginAccount')"><el-input :model-value="activePasswordRow?.loginAccount || '-'" disabled /></el-form-item>
                <el-form-item :label="t('system.account.newPassword')" prop="password"><el-input v-model="resetPasswordForm.password" type="password" show-password autocomplete="new-password" /></el-form-item>
                <el-form-item :label="t('system.account.confirmPassword')" prop="confirmPassword"><el-input v-model="resetPasswordForm.confirmPassword" type="password" show-password autocomplete="new-password" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" size="small" :loading="resetPasswordSaving" @click="submitResetPassword">{{ t('common.confirm') }}</el-button>
                    <el-button size="small" @click="resetPasswordVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
        <el-dialog v-model="mfaActionVisible" :title="mfaActionTitle" width="560px" destroy-on-close>
            <el-alert class="mfa-action-alert" :title="mfaActionTip" type="warning" show-icon :closable="false" />
            <el-form ref="mfaActionFormRef" :model="mfaActionForm" :rules="mfaActionRules" label-width="96px">
                <el-form-item :label="t('system.account.loginAccount')"><el-input :model-value="activeMfaRow?.loginAccount || '-'" disabled /></el-form-item>
                <el-form-item v-if="mfaActionType === 'exempt'" :label="t('system.account.mfaExemptUntil')" prop="exemptUntil">
                    <el-date-picker v-model="mfaActionForm.exemptUntil" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" :placeholder="t('system.account.mfaLongTermExempt')" style="width:100%" />
                </el-form-item>
                <el-form-item :label="t('common.remark')" prop="reason">
                    <el-input v-model="mfaActionForm.reason" type="textarea" maxlength="500" show-word-limit :autosize="{ minRows: 3, maxRows: 5 }" :placeholder="t('system.account.mfaReasonPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" size="small" :loading="mfaActionSaving" @click="submitMfaAction">{{ t('common.confirm') }}</el-button>
                    <el-button size="small" @click="mfaActionVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { MoreFilled, Plus, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { systemApi, type AccountItem, type DeptItem, type PostItem, type RoleItem } from '@/api/systemApi';
import { hasPermission } from '@/utils/permission';

const { t } = useI18n();
const loading = ref(false);
const visible = ref(false);
const showSearch = ref(true);
const rows = ref<AccountItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const roles = ref<RoleItem[]>([]);
const posts = ref<PostItem[]>([]);
const deptTree = ref<DeptItem[]>([]);
const query = reactive<{ keyword: string; roleId?: number; status?: number }>({ keyword: '' });
const form = reactive<Partial<AccountItem> & { password?: string }>({ status: 1, roleIds: [], deptIds: [], postIds: [] });
const formRef = ref<FormInstance>();
type MfaActionType = 'require' | 'reset' | 'exempt' | 'disable' | 'unlock' | 'resend';
const mfaActionVisible = ref(false);
const mfaActionSaving = ref(false);
const mfaActionType = ref<MfaActionType>('require');
const activeMfaRow = ref<AccountItem | null>(null);
const mfaActionFormRef = ref<FormInstance>();
const mfaActionForm = reactive({ reason: '', exemptUntil: '' });
const resetPasswordVisible = ref(false);
const resetPasswordSaving = ref(false);
const activePasswordRow = ref<AccountItem | null>(null);
const resetPasswordFormRef = ref<FormInstance>();
const resetPasswordForm = reactive({ password: '', confirmPassword: '' });
const rules = computed<FormRules>(() => ({
    loginAccount: [{ required: true, message: t('system.account.loginAccountRequired'), trigger: 'blur' }],
    password: [{ required: !form.accountId, message: t('system.account.initialPasswordRequired'), trigger: 'blur' }],
    realName: [{ required: true, message: t('system.account.realNameRequired'), trigger: 'blur' }],
    email: [
        { required: true, message: t('system.account.emailRequired'), trigger: 'blur' },
        { type: 'email', message: t('system.account.emailFormat'), trigger: ['blur', 'change'] },
    ],
}));
const mfaActionRules = computed<FormRules>(() => ({
    reason: [{ required: true, message: t('system.account.mfaReasonRequired'), trigger: 'blur' }],
}));
const resetPasswordRules = computed<FormRules>(() => ({
    password: [
        { required: true, message: t('system.account.newPasswordRequired'), trigger: 'blur' },
        { min: 8, max: 64, message: t('system.account.passwordLength'), trigger: 'blur' },
    ],
    confirmPassword: [
        { required: true, message: t('system.account.confirmPasswordRequired'), trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (value !== resetPasswordForm.password) callback(new Error(t('system.account.passwordMismatch')));
                else callback();
            },
            trigger: 'blur',
        },
    ],
}));
const canAdd = hasPermission('merchant:system:account:add');
const canEdit = hasPermission('merchant:system:account:edit');
const canDelete = hasPermission('merchant:system:account:delete');
const canResetPassword = hasPermission('merchant:system:account:resetPassword');
const canChangeStatus = hasPermission('merchant:system:account:status');
const canAssignRole = hasPermission('merchant:system:account:assignRole');
const canMfaRequire = hasPermission('merchant:system:account:mfa:require');
const canMfaReset = hasPermission('merchant:system:account:mfa:reset');
const canMfaExempt = hasPermission('merchant:system:account:mfa:exempt');
const canMfaDisable = hasPermission('merchant:system:account:mfa:disable');
const canMfaUnlock = hasPermission('merchant:system:account:mfa:unlock');
const canMfaResend = hasPermission('merchant:system:account:mfa:resend');
const canSaveAccountBase = computed(() => form.accountId ? canEdit : canAdd);
const hasPasswordActions = computed(() => canResetPassword);
const hasAccountMoreActions = computed(() => canChangeStatus || canDelete || hasPasswordActions.value);
const hasMfaActions = computed(() => canMfaRequire || canMfaReset || canMfaExempt || canMfaDisable || canMfaUnlock || canMfaResend);
const hasActionMenu = computed(() => canEdit || canAssignRole || hasAccountMoreActions.value || hasMfaActions.value);
const hasSelfProtectedMfaActions = computed(() => canMfaReset || canMfaExempt || canMfaDisable);
const mfaActionTitle = computed(() => t(`system.account.${mfaActionTitleKey(mfaActionType.value)}`));
const mfaActionTip = computed(() => t(`system.account.${mfaActionTipKey(mfaActionType.value)}`));

async function loadData() {
    loading.value = true;
    try {
        const [accountPage, roleRows, postRows, deptRows] = await Promise.all([
            systemApi.pageAccounts({
                pageNo: page.value,
                pageSize: pageSize.value,
                keyword: query.keyword.trim() || undefined,
                roleId: query.roleId,
                status: query.status,
            }),
            systemApi.roles(),
            systemApi.posts(),
            systemApi.deptTree(),
        ]);
        rows.value = accountPage.records;
        total.value = accountPage.total;
        roles.value = roleRows;
        posts.value = postRows;
        deptTree.value = deptRows;
    } finally {
        loading.value = false;
    }
}

function applyQuery() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    query.keyword = '';
    query.roleId = undefined;
    query.status = undefined;
    applyQuery();
}

function openForm(row?: AccountItem) {
    Object.assign(form, row ? { ...row, password: undefined } : { accountId: undefined, loginAccount: '', password: '', realName: '', mobile: '', email: '', status: 1, roleIds: [], deptIds: [], postIds: [] });
    visible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function submit() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    if (!form.accountId) {
        await systemApi.saveAccount(form);
    } else {
        const tasks: Promise<unknown>[] = [];
        if (canEdit) {
            tasks.push(systemApi.saveAccount(form, form.accountId));
            tasks.push(systemApi.assignAccountDepts(form.accountId, form.deptIds || []));
            tasks.push(systemApi.assignAccountPosts(form.accountId, form.postIds || []));
        }
        if (canAssignRole) {
            tasks.push(systemApi.assignAccountRoles(form.accountId, form.roleIds || []));
        }
        await Promise.all(tasks);
    }
    ElMessage.success(t('common.saveSuccess'));
    visible.value = false;
    await loadData();
}

async function toggleStatus(row: AccountItem) {
    await systemApi.changeAccountStatus(row.accountId, row.status === 1 ? 0 : 1);
    await loadData();
}

async function remove(row: AccountItem) {
    await ElMessageBox.confirm(t('system.account.deleteConfirm', { name: row.loginAccount }), t('common.deleteConfirmTitle'), { type: 'warning' });
    await systemApi.deleteAccount(row.accountId);
    ElMessage.success(t('common.deleteSuccess'));
    await loadData();
}

function handleAccountCommand(command: string, row: AccountItem) {
    if (command === 'edit') {
        openForm(row);
        return;
    }
    if (command === 'status') {
        toggleStatus(row);
        return;
    }
    if (command === 'delete') {
        remove(row);
        return;
    }
    if (command === 'resetPassword') {
        openResetPassword(row);
        return;
    }
    const actionMap: Record<string, MfaActionType> = {
        mfaRequire: 'require',
        mfaReset: 'reset',
        mfaUnlock: 'unlock',
        mfaResend: 'resend',
        mfaExempt: 'exempt',
        mfaDisable: 'disable',
    };
    const action = actionMap[command];
    if (action) {
        if (activeSelfProtectedMfaAction(row, action)) {
            ElMessage.warning(t('system.account.mfaSelfProtectedTip'));
            return;
        }
        openMfaAction(row, action);
    }
}

function openResetPassword(row: AccountItem) {
    if (row.currentAccount) {
        ElMessage.warning(t('system.account.passwordSelfProtectedTip'));
        return;
    }
    activePasswordRow.value = row;
    resetPasswordForm.password = '';
    resetPasswordForm.confirmPassword = '';
    resetPasswordVisible.value = true;
    nextTick(() => resetPasswordFormRef.value?.clearValidate());
}

async function submitResetPassword() {
    const valid = await resetPasswordFormRef.value?.validate().catch(() => false);
    if (!valid || !activePasswordRow.value) {
        return;
    }
    resetPasswordSaving.value = true;
    try {
        await systemApi.resetAccountPassword(activePasswordRow.value.accountId, { password: resetPasswordForm.password });
        ElMessage.success(t('system.account.resetPasswordSuccess'));
        resetPasswordVisible.value = false;
        await loadData();
    } catch (error) {
        ElMessage.error(resolveResetPasswordErrorMessage(error));
    } finally {
        resetPasswordSaving.value = false;
    }
}

function activeSelfProtectedMfaAction(row: AccountItem, action: MfaActionType) {
    return Boolean(row.currentAccount) && ['reset', 'exempt', 'disable'].includes(action);
}

function openMfaAction(row: AccountItem, action: MfaActionType) {
    activeMfaRow.value = row;
    mfaActionType.value = action;
    mfaActionForm.reason = '';
    mfaActionForm.exemptUntil = '';
    mfaActionVisible.value = true;
    nextTick(() => mfaActionFormRef.value?.clearValidate());
}

async function submitMfaAction() {
    const valid = await mfaActionFormRef.value?.validate().catch(() => false);
    if (!valid || !activeMfaRow.value) {
        return;
    }
    mfaActionSaving.value = true;
    try {
        const id = activeMfaRow.value.accountId;
        const payload = { reason: mfaActionForm.reason.trim() };
        if (mfaActionType.value === 'require') await systemApi.requireAccountMfa(id, payload);
        if (mfaActionType.value === 'reset') await systemApi.resetAccountMfa(id, payload);
        if (mfaActionType.value === 'unlock') await systemApi.unlockAccountMfa(id, payload);
        if (mfaActionType.value === 'resend') await systemApi.resendAccountMfaBindMail(id, payload);
        if (mfaActionType.value === 'disable') await systemApi.disableAccountMfa(id, payload);
        if (mfaActionType.value === 'exempt') {
            await systemApi.exemptAccountMfa(id, { ...payload, exemptUntil: mfaActionForm.exemptUntil || undefined });
        }
        ElMessage.success(t('common.operationSuccess'));
        mfaActionVisible.value = false;
        await loadData();
    } catch (error) {
        ElMessage.error(resolveMfaActionErrorMessage(error));
    } finally {
        mfaActionSaving.value = false;
    }
}

function mfaPolicyText(value?: string) {
    return value ? t(`system.account.mfaPolicy_${value}`, value) : t('system.account.mfaPolicy_OPTIONAL');
}

function mfaStatusText(value?: string) {
    return value ? t(`system.account.mfaStatus_${value}`, value) : t('system.account.mfaStatus_NOT_ENABLED');
}

function mfaPolicyTag(value?: string) {
    if (value === 'REQUIRED') return 'warning';
    if (value === 'EXEMPT') return 'info';
    return 'primary';
}

function mfaStatusTag(value?: string) {
    if (value === 'ENABLED') return 'success';
    if (value === 'LOCKED') return 'danger';
    if (value === 'PENDING_BIND' || value === 'RESET_REQUIRED') return 'warning';
    return 'info';
}

function mfaActionTitleKey(value: MfaActionType) {
    return ({
        require: 'mfaRequireTitle',
        reset: 'mfaResetTitle',
        exempt: 'mfaExemptTitle',
        disable: 'mfaDisableTitle',
        unlock: 'mfaUnlockTitle',
        resend: 'mfaResendTitle',
    })[value];
}

function mfaActionTipKey(value: MfaActionType) {
    return ({
        require: 'mfaRequireTip',
        reset: 'mfaResetTip',
        exempt: 'mfaExemptTip',
        disable: 'mfaDisableTip',
        unlock: 'mfaUnlockTip',
        resend: 'mfaResendTip',
    })[value];
}

function resolveMfaActionErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const key = ({
        '不能重置当前登录账号自己的 MFA': 'mfaCannotResetSelf',
        '不能豁免当前登录账号自己的 MFA': 'mfaCannotExemptSelf',
        '不能停用当前登录账号自己的 MFA': 'mfaCannotDisableSelf',
        'MFA 绑定邮件只能对待绑定或需重绑用户重发': 'mfaBindMailOnlyPending',
        'can not reset own mfa': 'mfaCannotResetSelf',
        'can not exempt own mfa': 'mfaCannotExemptSelf',
        'can not disable own mfa': 'mfaCannotDisableSelf',
        'mfa bind mail can only resend for pending users': 'mfaBindMailOnlyPending',
    } as Record<string, string>)[message];
    return key ? t(`system.account.${key}`) : (message || t('system.account.mfaActionFailed'));
}

function resolveResetPasswordErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const key = ({
        '不能重置当前登录账号密码，请在个人中心修改密码': 'passwordCannotResetSelf',
        'can not reset current account password': 'passwordCannotResetSelf',
    } as Record<string, string>)[message];
    return key ? t(`system.account.${key}`) : (message || t('system.account.resetPasswordFailed'));
}

onMounted(loadData);
</script>

<style scoped>
.account-operation-group {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
}

.account-operation-group :deep(.el-dropdown) {
    display: inline-flex;
}

.account-operation-group :deep(.el-button + .el-button) {
    margin-left: 0;
}

.mfa-action-alert {
    margin-bottom: 14px;
}

.reset-password-alert {
    margin-bottom: 14px;
}
</style>
