<template>
    <PageContainer title="角色管理" category="系统管理" description="查询和维护后台角色、数据范围和授权资源统计。">
        <template #extra>
            <el-tag type="success" effect="plain">接口已接入</el-tag>
        </template>

        <BaseSearch :model="query" :fields="searchFields" @search="handleSearch" @reset="handleReset" />

        <div class="toolbar">
            <div class="toolbar-left">
                <el-button type="primary" @click="openCreate">新增</el-button>
                <el-button @click="loadData">刷新</el-button>
            </div>
            <span class="security-note">角色编码创建后暂不支持改名；系统角色禁止删除。</span>
        </div>

        <div class="table-panel">
            <el-table
                v-loading="loading"
                :data="rows"
                border
                stripe
                row-key="roleId"
                class="base-table"
            >
                <template #empty>
                    <el-empty description="暂无数据" />
                </template>
                <el-table-column prop="roleId" label="角色ID" width="100" />
                <el-table-column prop="roleCode" label="角色编码" min-width="180" show-overflow-tooltip />
                <el-table-column prop="roleName" label="角色名称" min-width="160" show-overflow-tooltip />
                <el-table-column prop="roleType" label="角色类型" width="120" />
                <el-table-column prop="dataScope" label="数据范围" width="120" />
                <el-table-column prop="menuCount" label="菜单数" width="100" />
                <el-table-column prop="permissionCount" label="权限数" width="100" />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <BaseStatusTag :value="row.statusTag" />
                    </template>
                </el-table-column>
                <el-table-column prop="sortNo" label="排序" width="90" />
                <el-table-column label="更新时间" min-width="180">
                    <template #default="{ row }">
                        <BaseDateTime :value="row.updatedAt" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="350" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openDetail(row)">查看</el-button>
                        <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                        <el-button link type="primary" @click="openMenuAuth(row)">菜单</el-button>
                        <el-button link type="primary" @click="openPermissionAuth(row)">权限</el-button>
                        <el-button
                            link
                            :type="row.status === 1 ? 'danger' : 'success'"
                            @click="toggleStatus(row)"
                        >
                            {{ row.status === 1 ? '停用' : '启用' }}
                        </el-button>
                        <el-button
                            link
                            type="danger"
                            :disabled="row.roleType === 'SYSTEM'"
                            @click="removeRole(row)"
                        >
                            删除
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
            v-model="roleDialogVisible"
            :title="formMode === 'create' ? '新增角色' : '编辑角色'"
            width="720px"
            @confirm="submitRoleForm"
        >
            <el-form ref="roleFormRef" :model="roleForm" :rules="roleFormRules" label-width="100px">
                <el-form-item label="角色编码" prop="roleCode">
                    <el-input v-model="roleForm.roleCode" :disabled="formMode === 'edit'" maxlength="80" />
                </el-form-item>
                <el-form-item label="角色名称" prop="roleName">
                    <el-input v-model="roleForm.roleName" maxlength="100" />
                </el-form-item>
                <el-form-item label="数据范围" prop="dataScope">
                    <el-select v-model="roleForm.dataScope">
                        <el-option v-for="item in dataScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="排序" prop="sortNo">
                    <el-input-number v-model="roleForm.sortNo" :min="0" :max="9999" />
                </el-form-item>
                <el-form-item v-if="formMode === 'edit'" label="状态" prop="status">
                    <el-select v-model="roleForm.status">
                        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="说明" prop="description">
                    <el-input v-model="roleForm.description" type="textarea" maxlength="500" show-word-limit />
                </el-form-item>
            </el-form>
        </BaseDialog>

        <BaseDialog v-model="detailVisible" title="角色详情" width="760px" @confirm="detailVisible = false">
            <el-descriptions :column="2" border class="dialog-descriptions">
                <el-descriptions-item label="角色ID">{{ activeRow?.roleId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="角色编码">{{ activeRow?.roleCode ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="角色名称">{{ activeRow?.roleName ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="角色类型">{{ activeRow?.roleType ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="数据范围">{{ activeRow?.dataScope ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="菜单数">{{ activeRow?.menuCount ?? 0 }}</el-descriptions-item>
                <el-descriptions-item label="权限数">{{ activeRow?.permissionCount ?? 0 }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <BaseStatusTag :value="activeRow?.statusTag" />
                </el-descriptions-item>
                <el-descriptions-item label="排序">{{ activeRow?.sortNo ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">
                    <BaseDateTime :value="activeRow?.updatedAt" />
                </el-descriptions-item>
                <el-descriptions-item label="说明" :span="2">{{ activeRow?.description ?? '-' }}</el-descriptions-item>
            </el-descriptions>
        </BaseDialog>

        <BaseDialog
            v-model="menuAuthVisible"
            title="菜单授权"
            width="760px"
            @confirm="submitMenuAuth"
        >
            <div v-loading="authLoading" class="auth-panel">
                <el-tree
                    ref="menuTreeRef"
                    :data="menuTree"
                    node-key="menuId"
                    show-checkbox
                    default-expand-all
                    :props="menuTreeProps"
                />
            </div>
        </BaseDialog>

        <BaseDialog
            v-model="permissionAuthVisible"
            title="权限授权"
            width="920px"
            @confirm="submitPermissionAuth"
        >
            <el-table
                ref="permissionTableRef"
                v-loading="authLoading"
                :data="permissionRows"
                border
                stripe
                row-key="permissionId"
                max-height="520"
                @selection-change="handlePermissionSelection"
            >
                <el-table-column type="selection" width="48" />
                <el-table-column prop="permissionCode" label="权限编码" min-width="240" show-overflow-tooltip />
                <el-table-column prop="permissionName" label="权限名称" min-width="180" show-overflow-tooltip />
                <el-table-column prop="resourceType" label="类型" width="100" />
                <el-table-column prop="httpMethod" label="方法" width="100" />
                <el-table-column prop="resourcePath" label="资源路径" min-width="220" show-overflow-tooltip />
            </el-table>
        </BaseDialog>
    </PageContainer>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type TableInstance } from 'element-plus';
import {
    createRole,
    deleteRole,
    getRoleMenus,
    getRolePermissions,
    grantRoleMenus,
    grantRolePermissions,
    searchRoles,
    updateRole,
    updateRoleStatus,
    type SysPermission,
    type SysRole,
} from '@/api/system/role';
import type { SysMenu } from '@/api/system/menu';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseDialog from '@/components/BaseDialog/index.vue';
import BaseSearch from '@/components/BaseSearch/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { CommonStatus } from '@/enums/status';
import type { CrudSearchField } from '@/types/admin';

interface RoleRow extends SysRole {
    statusTag: CommonStatus;
}

interface RoleForm {
    roleId?: number;
    roleCode: string;
    roleName: string;
    dataScope: string;
    description: string;
    status: number;
    sortNo: number;
}

interface MenuTreeExpose {
    getCheckedKeys: (leafOnly?: boolean) => Array<string | number>;
    getHalfCheckedKeys: () => Array<string | number>;
    setCheckedKeys: (keys: number[]) => void;
}

const statusOptions = [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
];

const dataScopeOptions = [
    { label: '全部', value: 'ALL' },
    { label: '本人', value: 'SELF' },
    { label: '自定义', value: 'CUSTOM' },
];

const searchFields: CrudSearchField[] = [
    { prop: 'roleCode', label: '角色编码', placeholder: '请输入角色编码' },
    { prop: 'roleName', label: '角色名称', placeholder: '请输入角色名称' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
];

const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const rows = ref<RoleRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const roleDialogVisible = ref(false);
const menuAuthVisible = ref(false);
const permissionAuthVisible = ref(false);
const authLoading = ref(false);
const authSaving = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeRow = ref<RoleRow | null>(null);
const roleFormRef = ref<FormInstance>();
const menuTreeRef = ref<MenuTreeExpose>();
const permissionTableRef = ref<TableInstance>();
const menuTree = ref<SysMenu[]>([]);
const menuTreeProps = {
    label: 'menuName',
    children: 'children',
};
const permissionRows = ref<SysPermission[]>([]);
const selectedPermissionIds = ref<number[]>([]);

const roleForm = reactive<RoleForm>({
    roleCode: '',
    roleName: '',
    dataScope: 'SELF',
    description: '',
    status: 1,
    sortNo: 100,
});

const roleFormRules: FormRules = {
    roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
    roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
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
        const result = await searchRoles({
            pageNo: page.value,
            pageSize: pageSize.value,
            roleCode: textValue(query.roleCode),
            roleName: textValue(query.roleName),
            status: numericStatus(),
        });
        rows.value = result.records.map(normalizeRow);
        total.value = result.total;
    } catch (error) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error instanceof Error ? error.message : '角色列表加载失败');
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
    Object.assign(roleForm, {
        roleId: undefined,
        roleCode: '',
        roleName: '',
        dataScope: 'SELF',
        description: '',
        status: 1,
        sortNo: 100,
    });
    roleDialogVisible.value = true;
    nextTick(() => roleFormRef.value?.clearValidate());
}

function openEdit(row: RoleRow) {
    formMode.value = 'edit';
    activeRow.value = row;
    Object.assign(roleForm, {
        roleId: row.roleId,
        roleCode: row.roleCode,
        roleName: row.roleName,
        dataScope: row.dataScope || 'SELF',
        description: row.description || '',
        status: row.status ?? 1,
        sortNo: row.sortNo ?? 100,
    });
    roleDialogVisible.value = true;
    nextTick(() => roleFormRef.value?.clearValidate());
}

function openDetail(row: RoleRow) {
    activeRow.value = row;
    detailVisible.value = true;
}

async function submitRoleForm() {
    const valid = await roleFormRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    try {
        if (formMode.value === 'create') {
            await createRole({
                roleCode: roleForm.roleCode.trim(),
                roleName: roleForm.roleName.trim(),
                dataScope: roleForm.dataScope,
                description: trimOptional(roleForm.description),
                sortNo: roleForm.sortNo,
            });
            ElMessage.success('角色已新增');
        } else if (roleForm.roleId) {
            await updateRole({
                roleId: roleForm.roleId,
                roleName: roleForm.roleName.trim(),
                dataScope: roleForm.dataScope,
                description: trimOptional(roleForm.description),
                status: roleForm.status,
                sortNo: roleForm.sortNo,
            });
            ElMessage.success('角色已更新');
        }
        roleDialogVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '角色保存失败');
    }
}

async function toggleStatus(row: RoleRow) {
    const nextStatus = row.status === 1 ? 0 : 1;
    const actionText = nextStatus === 1 ? '启用' : '停用';
    try {
        await ElMessageBox.confirm(`确定${actionText}角色 ${row.roleName}？`, `${actionText}角色`, {
            type: nextStatus === 1 ? 'success' : 'warning',
        });
        await updateRoleStatus({ roleId: row.roleId, status: nextStatus });
        ElMessage.success(`角色已${actionText}`);
        loadData();
    } catch (error) {
        if (error instanceof Error) {
            ElMessage.error(error.message);
        }
    }
}

async function removeRole(row: RoleRow) {
    try {
        await ElMessageBox.confirm(`确定删除角色 ${row.roleName}？`, '删除角色', { type: 'warning' });
        await deleteRole({ roleId: row.roleId });
        ElMessage.success('角色已删除');
        loadData();
    } catch (error) {
        if (error instanceof Error) {
            ElMessage.error(error.message);
        }
    }
}

async function openMenuAuth(row: RoleRow) {
    activeRow.value = row;
    menuAuthVisible.value = true;
    authLoading.value = true;
    try {
        const result = await getRoleMenus({ roleId: row.roleId });
        menuTree.value = result.menus;
        await nextTick();
        menuTreeRef.value?.setCheckedKeys(result.checkedMenuIds || []);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '菜单授权加载失败');
        menuAuthVisible.value = false;
    } finally {
        authLoading.value = false;
    }
}

async function submitMenuAuth() {
    if (!activeRow.value || authSaving.value) {
        return;
    }
    authSaving.value = true;
    try {
        const checkedKeys = menuTreeRef.value?.getCheckedKeys(false) || [];
        const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || [];
        await grantRoleMenus({
            roleId: activeRow.value.roleId,
            menuIds: normalizeIds([...checkedKeys, ...halfCheckedKeys]),
        });
        ElMessage.success('菜单授权已保存');
        menuAuthVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '菜单授权保存失败');
    } finally {
        authSaving.value = false;
    }
}

async function openPermissionAuth(row: RoleRow) {
    activeRow.value = row;
    permissionAuthVisible.value = true;
    authLoading.value = true;
    try {
        const result = await getRolePermissions({ roleId: row.roleId });
        permissionRows.value = result.permissions;
        selectedPermissionIds.value = result.checkedPermissionIds || [];
        await nextTick();
        applyPermissionSelection();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '权限授权加载失败');
        permissionAuthVisible.value = false;
    } finally {
        authLoading.value = false;
    }
}

function handlePermissionSelection(selection: SysPermission[]) {
    selectedPermissionIds.value = selection.map((item) => item.permissionId);
}

async function submitPermissionAuth() {
    if (!activeRow.value || authSaving.value) {
        return;
    }
    authSaving.value = true;
    try {
        await grantRolePermissions({
            roleId: activeRow.value.roleId,
            permissionIds: selectedPermissionIds.value,
        });
        ElMessage.success('权限授权已保存');
        permissionAuthVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '权限授权保存失败');
    } finally {
        authSaving.value = false;
    }
}

function textValue(value: unknown) {
    return String(value || '').trim() || undefined;
}

function numericStatus() {
    return typeof query.status === 'number' ? query.status : undefined;
}

function normalizeRow(row: SysRole): RoleRow {
    return {
        ...row,
        statusTag: row.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled,
    };
}

function trimOptional(value: string) {
    return value.trim() || undefined;
}

function normalizeIds(keys: Array<string | number>) {
    return Array.from(new Set(keys.map(Number).filter((item) => Number.isInteger(item) && item > 0)));
}

function applyPermissionSelection() {
    const checkedIdSet = new Set(selectedPermissionIds.value);
    permissionRows.value.forEach((row) => {
        permissionTableRef.value?.toggleRowSelection(row, checkedIdSet.has(row.permissionId));
    });
}
</script>

<style scoped>
.auth-panel {
    min-height: 360px;
    max-height: 560px;
    overflow: auto;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 12px;
}
</style>
