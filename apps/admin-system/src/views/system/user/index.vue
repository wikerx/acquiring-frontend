<template>
    <div class="app-container">
        <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="$t('system.user.loginAccount')" prop="loginAccount">
                <el-input v-model="query.loginAccount" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item :label="$t('common.status')" prop="status">
                <el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleQuery">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'system:user:add'">{{ $t('common.add') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :icon="Edit" size="small" :disabled="!selectedRows.length || selectedRows.length !== 1" @click="handleUpdate(selectedRows[0])" v-hasPermi="'system:user:edit'">{{ $t('common.edit') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'system:user:remove'">{{ $t('common.delete') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'system:user:export'">{{ $t('common.export') }}</el-button>
            </el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleQuery" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="accountId" size="small" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="loginAccount" :label="$t('system.user.loginAccount')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="realName" :label="$t('system.user.realName')" min-width="120" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="mobile" :label="$t('system.user.mobile')" min-width="130" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="email" :label="$t('system.user.email')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('common.status')" width="80" align="center">
                <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" /></template>
            </el-table-column>
            <el-table-column prop="lockedText" :label="$t('system.user.locked')" width="60" align="center" />
            <el-table-column :label="$t('system.user.lastLogin')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.lastLoginAt" /></template></el-table-column>
            <el-table-column :label="$t('common.createTime')" min-width="160" align="center"><template #default="{ row }"><BaseDateTime :value="row.createdAt" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="240" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:user:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="UserFilled" @click="openRoleAuth(row)" v-hasPermi="'system:user:assign-role'">{{ $t('system.user.assignRole') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Key" @click="openResetPassword(row)" v-hasPermi="'system:user:resetPwd'">{{ $t('system.user.resetPassword') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="dialogTitle" v-model="userDialogVisible" width="560px" append-to-body destroy-on-close>
            <el-form ref="userFormRef" :model="userForm" :rules="userFormRules" label-width="90px" style="padding:0 20px">
                <el-form-item :label="$t('system.user.loginAccount')" prop="loginAccount"><el-input v-model="userForm.loginAccount" :disabled="formMode === 'edit'" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item v-if="formMode === 'create'" :label="$t('system.user.initPassword')" prop="password"><el-input v-model="userForm.password" type="password" show-password maxlength="64" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.user.realName')" prop="realName"><el-input v-model="userForm.realName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.user.mobile')" prop="mobile"><el-input v-model="userForm.mobile" maxlength="30" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.user.email')" prop="email"><el-input v-model="userForm.email" maxlength="150" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item v-if="formMode === 'edit'" :label="$t('common.status')" prop="status"><el-select v-model="userForm.status" :placeholder="$t('common.pleaseSelect')"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="$t('system.user.assignRole')">
                    <el-select v-model="selectedRoleIds" multiple :placeholder="$t('common.pleaseSelect')" :loading="roleLoading" style="width:100%">
                        <el-option v-for="role in roleOptions" :key="role.roleId" :label="role.roleName + ' (' + role.roleCode + ')'" :value="role.roleId" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitUserForm">{{ $t('common.confirm') }}</el-button><el-button @click="userDialogVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>

        <el-dialog v-model="resetDialogVisible" :title="$t('system.user.resetPassword')" width="480px" append-to-body destroy-on-close>
            <el-form ref="resetFormRef" :model="resetForm" :rules="resetFormRules" label-width="80px">
                <el-form-item :label="$t('system.user.loginAccount')"><el-input :model-value="activeRow?.loginAccount || '-'" disabled /></el-form-item>
                <el-form-item :label="$t('login.password')" prop="password"><el-input v-model="resetForm.password" type="password" show-password maxlength="64" :placeholder="$t('common.pleaseInput')" /></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitResetPassword">{{ $t('common.confirm') }}</el-button><el-button @click="resetDialogVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>

        <el-dialog v-model="detailVisible" :title="$t('system.user.userDetail')" width="620px" append-to-body destroy-on-close>
            <el-descriptions :column="1" border size="small">
                <el-descriptions-item :label="$t('system.user.accountId')">{{ activeRow?.accountId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.userId')">{{ activeRow?.userId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.loginAccount')">{{ activeRow?.loginAccount ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.realName')">{{ activeRow?.realName ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.mobile')">{{ activeRow?.mobile ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.email')">{{ activeRow?.email ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')"><el-tag :type="activeRow?.status === 1 ? 'success' : 'danger'" size="small">{{ activeRow?.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.locked')">{{ activeRow?.lockedText ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.lastLogin')"><BaseDateTime :value="activeRow?.lastLoginAt" /></el-descriptions-item>
                <el-descriptions-item :label="$t('system.user.lastLoginIp')">{{ activeRow?.lastLoginIp ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="activeRow?.createdAt" /></el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog v-model="roleAuthVisible" :title="$t('system.user.assignRole')" width="700px" append-to-body destroy-on-close>
            <el-table ref="roleTableRef" v-loading="roleAuthLoading" :data="roleRows" row-key="roleId" max-height="420" @selection-change="handleRoleSelection">
                <el-table-column type="selection" width="50" align="center" />
                <el-table-column prop="roleCode" :label="$t('system.user.roleCode')" min-width="160" align="center" :show-overflow-tooltip="true" />
                <el-table-column prop="roleName" :label="$t('system.user.roleName')" min-width="140" align="center" :show-overflow-tooltip="true" />
                <el-table-column prop="roleType" :label="$t('system.user.roleType')" width="100" align="center" />
                <el-table-column prop="dataScope" :label="$t('system.user.dataScope')" width="110" align="center" />
                <el-table-column :label="$t('common.status')" width="80" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></template></el-table-column>
            </el-table>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitRoleAuth">{{ $t('common.confirm') }}</el-button><el-button @click="roleAuthVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type TableInstance } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download, View, UserFilled, Key } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { createUser, getUserRoles, grantUserRoles, resetUserPassword, searchUsers, updateUser, updateUserStatus, type SysUserAccount } from '@/api/system/user';
import { searchRoles, type SysRole } from '@/api/system/role';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { CommonStatus } from '@/enums/status';

const { t } = useI18n();

interface UserRow extends SysUserAccount { statusTag: CommonStatus; lockedText: string; }
interface UserForm { accountId?: number; loginAccount: string; password: string; realName: string; mobile: string; email: string; status: number; }

const statusOptions = [{ label: t('common.enable'), value: 1 }, { label: t('common.disable'), value: 0 }];
const showSearch = ref(true);
const query = reactive<Record<string, unknown>>({});
const queryFormRef = ref<FormInstance>();
const loading = ref(false);
const rows = ref<UserRow[]>([]);
const total = ref(0);
const page = ref(1); const pageSize = ref(10);
const selectedRows = ref<UserRow[]>([]);
const detailVisible = ref(false); const userDialogVisible = ref(false); const resetDialogVisible = ref(false); const roleAuthVisible = ref(false);
const roleAuthLoading = ref(false); const roleAuthSaving = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeRow = ref<UserRow | null>(null);
const userFormRef = ref<FormInstance>(); const resetFormRef = ref<FormInstance>(); const roleTableRef = ref<TableInstance>();
const roleOptions = ref<SysRole[]>([]); const roleRows = ref<SysRole[]>([]); const selectedRoleIds = ref<number[]>([]); const roleLoading = ref(false);
const dialogTitle = computed(() => formMode.value === 'create' ? t('system.user.addUser') : t('system.user.editUser'));
const userForm = reactive<UserForm>({ loginAccount: '', password: '', realName: '', mobile: '', email: '', status: 1 });
const resetForm = reactive({ password: '' });
const userFormRules = computed<FormRules>(() => ({
    loginAccount: [{ required: true, message: t('login.accountRequired'), trigger: 'blur' }],
    password: formMode.value === 'create' ? [{ required: true, min: 8, max: 64, message: t('common.pleaseInput'), trigger: 'blur' }] : [],
    realName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    email: [{ type: 'email', message: t('common.pleaseInput'), trigger: 'blur' }],
}));
const resetFormRules: FormRules = { password: [{ required: true, min: 8, max: 64, message: t('common.pleaseInput'), trigger: 'blur' }] };

watch([page, pageSize], () => { loadData(); });
onMounted(() => { loadData(); });

async function loadData() {
    loading.value = true;
    try {
        const result = await searchUsers({ pageNo: page.value, pageSize: pageSize.value, loginAccount: keyword(), status: numericStatus() });
        rows.value = result.records.map(normalizeRow); total.value = result.total;
    } catch (error) { rows.value = []; total.value = 0; ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed')); }
    finally { loading.value = false; }
}

function handleQuery() { if (page.value === 1) { loadData(); return; } page.value = 1; }
function resetQuery() { Object.keys(query).forEach((k) => { query[k] = ''; }); handleQuery(); }
function handleSelectionChange(selection: UserRow[]) { selectedRows.value = selection; }

async function handleAdd() {
    formMode.value = 'create'; activeRow.value = null;
    Object.assign(userForm, { accountId: undefined, loginAccount: '', password: 'Admin@123456', realName: '', mobile: '', email: '', status: 1 });
    selectedRoleIds.value = []; roleOptions.value = []; roleLoading.value = true; userDialogVisible.value = true; nextTick(() => userFormRef.value?.clearValidate());
    try { const r = await searchRoles({ pageNo: 1, pageSize: 1000 }); roleOptions.value = r.records; } catch { /* roles may not load */ } finally { roleLoading.value = false; }
}
async function handleUpdate(row: UserRow) {
    formMode.value = 'edit'; activeRow.value = row;
    Object.assign(userForm, { accountId: row.accountId, loginAccount: row.loginAccount, password: '', realName: row.realName || '', mobile: row.mobile || '', email: row.email || '', status: row.status ?? 1 });
    roleLoading.value = true; userDialogVisible.value = true; nextTick(() => userFormRef.value?.clearValidate());
    try {
        const r = await getUserRoles({ accountId: row.accountId });
        roleOptions.value = r.roles; selectedRoleIds.value = r.checkedRoleIds || [];
    } catch { roleOptions.value = []; selectedRoleIds.value = []; } finally { roleLoading.value = false; }
}
function openDetail(row: UserRow) { activeRow.value = row; detailVisible.value = true; }
function openResetPassword(row: UserRow) { activeRow.value = row; resetForm.password = 'Admin@123456'; resetDialogVisible.value = true; nextTick(() => resetFormRef.value?.clearValidate()); }

async function submitUserForm() {
    const valid = await userFormRef.value?.validate().catch(() => false); if (!valid) return;
    try {
        let accountId: number | undefined;
        if (formMode.value === 'create') { const created = await createUser({ loginAccount: userForm.loginAccount.trim(), password: userForm.password, realName: userForm.realName.trim(), mobile: trimOptional(userForm.mobile), email: trimOptional(userForm.email) }); accountId = created.accountId; ElMessage.success(t('common.addSuccess')); }
        else if (userForm.accountId) { await updateUser({ accountId: userForm.accountId, realName: userForm.realName.trim(), mobile: trimOptional(userForm.mobile), email: trimOptional(userForm.email), status: userForm.status }); accountId = userForm.accountId; ElMessage.success(t('common.editSuccess')); }
        if (accountId) await grantUserRoles({ accountId, roleIds: selectedRoleIds.value });
        userDialogVisible.value = false; loadData();
    } catch (error) { ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed')); }
}
async function submitResetPassword() {
    const valid = await resetFormRef.value?.validate().catch(() => false); if (!valid || !activeRow.value) return;
    try { await resetUserPassword({ accountId: activeRow.value.accountId, password: resetForm.password }); resetDialogVisible.value = false; ElMessage.success(t('common.success')); }
    catch (error) { ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed')); }
}
async function handleStatusChange(row: UserRow) {
    const nextStatus = row.status === 1 ? 0 : 1;
    const actionText = nextStatus === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('system.user.statusToggleConfirm', { action: actionText, name: row.loginAccount }), t('common.confirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
        await updateUserStatus({ accountId: row.accountId, status: nextStatus });
        ElMessage.success(t('common.success')); loadData();
    } catch (error) { if (error instanceof Error) ElMessage.error(error.message); }
}
async function handleDelete(rowsParam?: UserRow[]) {
    const targets = rowsParam ?? selectedRows.value;
    if (!targets.length) { ElMessage.warning(t('common.pleaseSelect')); return; }
    const names = targets.map((r) => r.loginAccount).join('、');
    try { await ElMessageBox.confirm(t('system.user.deleteConfirm', { name: names }), t('common.delete'), { type: 'warning' }); ElMessage.info(t('common.deleteSuccess')); } catch { /* cancelled */ }
}
function handleExport() { ElMessage.info(t('common.export')); }

async function openRoleAuth(row: UserRow) {
    activeRow.value = row; roleAuthVisible.value = true; roleAuthLoading.value = true;
    try { const result = await getUserRoles({ accountId: row.accountId }); roleRows.value = result.roles; selectedRoleIds.value = result.checkedRoleIds || []; await nextTick(); applyRoleSelection(); }
    catch (error) { ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed')); roleAuthVisible.value = false; }
    finally { roleAuthLoading.value = false; }
}
function handleRoleSelection(selection: SysRole[]) { selectedRoleIds.value = selection.map((item) => item.roleId); }
async function submitRoleAuth() {
    if (!activeRow.value || roleAuthSaving.value) return; roleAuthSaving.value = true;
    try { await grantUserRoles({ accountId: activeRow.value.accountId, roleIds: selectedRoleIds.value }); ElMessage.success(t('common.saveSuccess')); roleAuthVisible.value = false; loadData(); }
    catch (error) { ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed')); }
    finally { roleAuthSaving.value = false; }
}

function keyword() { return String(query.loginAccount || '').trim() || undefined; }
function numericStatus() { return typeof query.status === 'number' ? query.status : undefined; }
function normalizeRow(row: SysUserAccount): UserRow { return { ...row, statusTag: row.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled, lockedText: row.locked === 1 ? t('common.yes') : t('common.no') }; }
function trimOptional(value: string) { return value.trim() || undefined; }
function applyRoleSelection() { const checkedIdSet = new Set(selectedRoleIds.value); roleRows.value.forEach((row) => { roleTableRef.value?.toggleRowSelection(row, checkedIdSet.has(row.roleId)); }); }
</script>
