<template>
    <PageContainer title="用户管理" category="系统管理" description="查询和维护后台用户账号、基础资料和登录状态。">
        <template #extra>
            <el-tag type="success" effect="plain">接口已接入</el-tag>
        </template>

        <BaseSearch :model="query" :fields="searchFields" @search="handleSearch" @reset="handleReset" />

        <div class="toolbar">
            <div class="toolbar-left">
                <el-button type="primary" @click="openCreate">新增</el-button>
                <el-button @click="loadData">刷新</el-button>
            </div>
            <span class="security-note">登录账号创建后暂不支持改名；角色变更后账号需重新登录生效。</span>
        </div>

        <div class="table-panel">
            <el-table
                v-loading="loading"
                :data="rows"
                border
                stripe
                row-key="accountId"
                class="base-table"
            >
                <template #empty>
                    <el-empty description="暂无数据" />
                </template>
                <el-table-column prop="accountId" label="账号ID" width="100" />
                <el-table-column prop="loginAccount" label="登录账号" min-width="150" show-overflow-tooltip />
                <el-table-column prop="realName" label="姓名" min-width="140" show-overflow-tooltip />
                <el-table-column prop="mobile" label="手机号" min-width="140" show-overflow-tooltip />
                <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <BaseStatusTag :value="row.statusTag" />
                    </template>
                </el-table-column>
                <el-table-column prop="lockedText" label="锁定" width="90" />
                <el-table-column label="最后登录" min-width="180">
                    <template #default="{ row }">
                        <BaseDateTime :value="row.lastLoginAt" />
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" min-width="180">
                    <template #default="{ row }">
                        <BaseDateTime :value="row.createdAt" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="310" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openDetail(row)">查看</el-button>
                        <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                        <el-button link type="primary" @click="openRoleAuth(row)">角色</el-button>
                        <el-button link type="warning" @click="openResetPassword(row)">重置密码</el-button>
                        <el-button
                            link
                            :type="row.status === 1 ? 'danger' : 'success'"
                            @click="toggleStatus(row)"
                        >
                            {{ row.status === 1 ? '停用' : '启用' }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="table-pagination">
                <el-pagination
                    v-model:current-page="page"
                    v-model:page-size="pageSize"
                    :total="total"
                    layout="total, sizes, prev, pager, next, jumper"
                    :page-sizes="[10, 20, 50, 100]"
                />
            </div>
        </div>

        <BaseDialog
            v-model="userDialogVisible"
            :title="formMode === 'create' ? '新增用户' : '编辑用户'"
            width="720px"
            @confirm="submitUserForm"
        >
            <el-form ref="userFormRef" :model="userForm" :rules="userFormRules" label-width="100px">
                <el-form-item label="登录账号" prop="loginAccount">
                    <el-input v-model="userForm.loginAccount" :disabled="formMode === 'edit'" maxlength="100" />
                </el-form-item>
                <el-form-item v-if="formMode === 'create'" label="初始密码" prop="password">
                    <el-input v-model="userForm.password" type="password" show-password maxlength="64" />
                </el-form-item>
                <el-form-item label="姓名" prop="realName">
                    <el-input v-model="userForm.realName" maxlength="100" />
                </el-form-item>
                <el-form-item label="手机号" prop="mobile">
                    <el-input v-model="userForm.mobile" maxlength="30" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="userForm.email" maxlength="150" />
                </el-form-item>
                <el-form-item v-if="formMode === 'edit'" label="状态" prop="status">
                    <el-select v-model="userForm.status">
                        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
            </el-form>
        </BaseDialog>

        <BaseDialog v-model="resetDialogVisible" title="重置密码" width="560px" @confirm="submitResetPassword">
            <el-form ref="resetFormRef" :model="resetForm" :rules="resetFormRules" label-width="100px">
                <el-form-item label="登录账号">
                    <el-input :model-value="activeRow?.loginAccount || '-'" disabled />
                </el-form-item>
                <el-form-item label="新密码" prop="password">
                    <el-input v-model="resetForm.password" type="password" show-password maxlength="64" />
                </el-form-item>
            </el-form>
        </BaseDialog>

        <BaseDialog v-model="detailVisible" title="用户详情" width="760px" @confirm="detailVisible = false">
            <el-descriptions :column="2" border class="dialog-descriptions">
                <el-descriptions-item label="账号ID">{{ activeRow?.accountId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="用户ID">{{ activeRow?.userId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="登录账号">{{ activeRow?.loginAccount ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ activeRow?.realName ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ activeRow?.mobile ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ activeRow?.email ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <BaseStatusTag :value="activeRow?.statusTag" />
                </el-descriptions-item>
                <el-descriptions-item label="锁定">{{ activeRow?.lockedText ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="最后登录">
                    <BaseDateTime :value="activeRow?.lastLoginAt" />
                </el-descriptions-item>
                <el-descriptions-item label="最后登录IP">{{ activeRow?.lastLoginIp ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">
                    <BaseDateTime :value="activeRow?.createdAt" />
                </el-descriptions-item>
            </el-descriptions>
        </BaseDialog>

        <BaseDialog
            v-model="roleAuthVisible"
            title="分配角色"
            width="820px"
            @confirm="submitRoleAuth"
        >
            <el-table
                ref="roleTableRef"
                v-loading="roleAuthLoading"
                :data="roleRows"
                border
                stripe
                row-key="roleId"
                max-height="480"
                @selection-change="handleRoleSelection"
            >
                <el-table-column type="selection" width="48" />
                <el-table-column prop="roleCode" label="角色编码" min-width="180" show-overflow-tooltip />
                <el-table-column prop="roleName" label="角色名称" min-width="150" show-overflow-tooltip />
                <el-table-column prop="roleType" label="类型" width="110" />
                <el-table-column prop="dataScope" label="数据范围" width="120" />
                <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                        <BaseStatusTag :value="row.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled" />
                    </template>
                </el-table-column>
            </el-table>
        </BaseDialog>
    </PageContainer>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type TableInstance } from 'element-plus';
import {
    createUser,
    getUserRoles,
    grantUserRoles,
    resetUserPassword,
    searchUsers,
    updateUser,
    updateUserStatus,
    type SysUserAccount,
} from '@/api/system/user';
import type { SysRole } from '@/api/system/role';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseDialog from '@/components/BaseDialog/index.vue';
import BaseSearch from '@/components/BaseSearch/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { CommonStatus } from '@/enums/status';
import type { CrudSearchField } from '@/types/admin';

interface UserRow extends SysUserAccount {
    statusTag: CommonStatus;
    lockedText: string;
}

interface UserForm {
    accountId?: number;
    loginAccount: string;
    password: string;
    realName: string;
    mobile: string;
    email: string;
    status: number;
}

const statusOptions = [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
];

const searchFields: CrudSearchField[] = [
    { prop: 'loginAccount', label: '登录账号', placeholder: '请输入登录账号' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
];

const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const rows = ref<UserRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const userDialogVisible = ref(false);
const resetDialogVisible = ref(false);
const roleAuthVisible = ref(false);
const roleAuthLoading = ref(false);
const roleAuthSaving = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeRow = ref<UserRow | null>(null);
const userFormRef = ref<FormInstance>();
const resetFormRef = ref<FormInstance>();
const roleTableRef = ref<TableInstance>();
const roleRows = ref<SysRole[]>([]);
const selectedRoleIds = ref<number[]>([]);

const userForm = reactive<UserForm>({
    loginAccount: '',
    password: '',
    realName: '',
    mobile: '',
    email: '',
    status: 1,
});

const resetForm = reactive({
    password: '',
});

const userFormRules = computed<FormRules>(() => ({
    loginAccount: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
    password: formMode.value === 'create'
        ? [{ required: true, min: 8, max: 64, message: '密码长度为 8-64 位', trigger: 'blur' }]
        : [],
    realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
}));

const resetFormRules: FormRules = {
    password: [{ required: true, min: 8, max: 64, message: '密码长度为 8-64 位', trigger: 'blur' }],
};

watch([page, pageSize], () => {
    loadData();
});

onMounted(() => {
    loadData();
});

async function loadData() {
    loading.value = true;
    try {
        const result = await searchUsers({
            pageNo: page.value,
            pageSize: pageSize.value,
            loginAccount: keyword(),
            status: numericStatus(),
        });
        rows.value = result.records.map(normalizeRow);
        total.value = result.total;
    } catch (error) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error instanceof Error ? error.message : '用户列表加载失败');
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    if (page.value === 1) {
        loadData();
        return;
    }
    page.value = 1;
}

function handleReset() {
    Object.keys(query).forEach((key) => {
        query[key] = '';
    });
    handleSearch();
}

function openCreate() {
    formMode.value = 'create';
    activeRow.value = null;
    Object.assign(userForm, {
        accountId: undefined,
        loginAccount: '',
        password: 'Admin@123456',
        realName: '',
        mobile: '',
        email: '',
        status: 1,
    });
    userDialogVisible.value = true;
    nextTick(() => userFormRef.value?.clearValidate());
}

function openEdit(row: UserRow) {
    formMode.value = 'edit';
    activeRow.value = row;
    Object.assign(userForm, {
        accountId: row.accountId,
        loginAccount: row.loginAccount,
        password: '',
        realName: row.realName || '',
        mobile: row.mobile || '',
        email: row.email || '',
        status: row.status ?? 1,
    });
    userDialogVisible.value = true;
    nextTick(() => userFormRef.value?.clearValidate());
}

function openDetail(row: UserRow) {
    activeRow.value = row;
    detailVisible.value = true;
}

function openResetPassword(row: UserRow) {
    activeRow.value = row;
    resetForm.password = 'Admin@123456';
    resetDialogVisible.value = true;
    nextTick(() => resetFormRef.value?.clearValidate());
}

async function submitUserForm() {
    const valid = await userFormRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    try {
        if (formMode.value === 'create') {
            await createUser({
                loginAccount: userForm.loginAccount.trim(),
                password: userForm.password,
                realName: userForm.realName.trim(),
                mobile: trimOptional(userForm.mobile),
                email: trimOptional(userForm.email),
            });
            ElMessage.success('用户已新增');
        } else if (userForm.accountId) {
            await updateUser({
                accountId: userForm.accountId,
                realName: userForm.realName.trim(),
                mobile: trimOptional(userForm.mobile),
                email: trimOptional(userForm.email),
                status: userForm.status,
            });
            ElMessage.success('用户已更新');
        }
        userDialogVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '用户保存失败');
    }
}

async function submitResetPassword() {
    const valid = await resetFormRef.value?.validate().catch(() => false);
    if (!valid || !activeRow.value) {
        return;
    }
    try {
        await resetUserPassword({
            accountId: activeRow.value.accountId,
            password: resetForm.password,
        });
        resetDialogVisible.value = false;
        ElMessage.success('密码已重置');
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '密码重置失败');
    }
}

async function toggleStatus(row: UserRow) {
    const nextStatus = row.status === 1 ? 0 : 1;
    const actionText = nextStatus === 1 ? '启用' : '停用';
    try {
        await ElMessageBox.confirm(`确定${actionText}用户 ${row.loginAccount}？`, `${actionText}用户`, {
            type: nextStatus === 1 ? 'success' : 'warning',
        });
        await updateUserStatus({ accountId: row.accountId, status: nextStatus });
        ElMessage.success(`用户已${actionText}`);
        loadData();
    } catch (error) {
        if (error instanceof Error) {
            ElMessage.error(error.message);
        }
    }
}

async function openRoleAuth(row: UserRow) {
    activeRow.value = row;
    roleAuthVisible.value = true;
    roleAuthLoading.value = true;
    try {
        const result = await getUserRoles({ accountId: row.accountId });
        roleRows.value = result.roles;
        selectedRoleIds.value = result.checkedRoleIds || [];
        await nextTick();
        applyRoleSelection();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '角色授权加载失败');
        roleAuthVisible.value = false;
    } finally {
        roleAuthLoading.value = false;
    }
}

function handleRoleSelection(selection: SysRole[]) {
    selectedRoleIds.value = selection.map((item) => item.roleId);
}

async function submitRoleAuth() {
    if (!activeRow.value || roleAuthSaving.value) {
        return;
    }
    roleAuthSaving.value = true;
    try {
        await grantUserRoles({
            accountId: activeRow.value.accountId,
            roleIds: selectedRoleIds.value,
        });
        ElMessage.success('角色分配已保存');
        roleAuthVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '角色分配保存失败');
    } finally {
        roleAuthSaving.value = false;
    }
}

function keyword() {
    return String(query.loginAccount || '').trim() || undefined;
}

function numericStatus() {
    return typeof query.status === 'number' ? query.status : undefined;
}

function normalizeRow(row: SysUserAccount): UserRow {
    return {
        ...row,
        statusTag: row.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled,
        lockedText: row.locked === 1 ? '是' : '否',
    };
}

function trimOptional(value: string) {
    return value.trim() || undefined;
}

function applyRoleSelection() {
    const checkedIdSet = new Set(selectedRoleIds.value);
    roleRows.value.forEach((row) => {
        roleTableRef.value?.toggleRowSelection(row, checkedIdSet.has(row.roleId));
    });
}
</script>
