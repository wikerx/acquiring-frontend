<template>
    <div class="app-container">
        <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="$t('system.role.roleCode')" prop="roleCode"><el-input v-model="query.roleCode" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item :label="$t('system.role.roleName')" prop="roleName"><el-input v-model="query.roleName" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleQuery">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button></el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'system:role:add'">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="!selectedRows.length || selectedRows.length !== 1" @click="handleUpdate(selectedRows[0])" v-hasPermi="'system:role:edit'">{{ $t('common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'system:role:remove'">{{ $t('common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleQuery" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="roleId" size="small" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="roleCode" :label="$t('system.role.roleCode')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="roleName" :label="$t('system.role.roleName')" min-width="140" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="roleType" :label="$t('system.role.roleType')" width="100" align="center" />
            <el-table-column :label="$t('system.role.dataScope')" width="100" align="center"><template #default="{ row }">{{ dataScopeLabel(row.dataScope) }}</template></el-table-column>
            <el-table-column prop="menuCount" :label="$t('system.role.menuCount')" width="80" align="center" />
            <el-table-column prop="permissionCount" :label="$t('system.role.permissionCount')" width="80" align="center" />
            <el-table-column :label="$t('common.status')" width="80" align="center"><template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" /></template></el-table-column>
            <el-table-column prop="sortNo" :label="$t('system.role.sortNo')" width="70" align="center" />
            <el-table-column :label="$t('common.updateTime')" min-width="160" align="center"><template #default="{ row }"><BaseDateTime :value="row.updatedAt" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="230" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:role:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Key" @click="openRoleAuth(row)" v-hasPermi="'system:role:dataScope'">{{ $t('system.role.assignAuth') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="removeRole(row)" v-hasPermi="'system:role:remove'" :disabled="row.roleType === 'SYSTEM'">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

        <el-dialog :title="dialogTitle" v-model="roleDialogVisible" :width="formMode === 'create' || formMode === 'edit' ? '800px' : '560px'" append-to-body destroy-on-close>
            <el-form ref="roleFormRef" :model="roleForm" :rules="roleFormRules" label-width="90px" style="padding:0 20px">
                <el-form-item :label="$t('system.role.roleCode')" prop="roleCode"><el-input v-model="roleForm.roleCode" :disabled="formMode === 'edit'" maxlength="80" placeholder="ROLE_XXX" /></el-form-item>
                <el-form-item :label="$t('system.role.roleName')" prop="roleName"><el-input v-model="roleForm.roleName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.role.dataScope')" prop="dataScope"><el-select v-model="roleForm.dataScope" style="width:100%"><el-option :label="$t('system.role.allData')" value="ALL" /><el-option :label="$t('system.role.selfData')" value="SELF" /><el-option :label="$t('system.role.customData')" value="CUSTOM" /></el-select></el-form-item>
                <el-form-item :label="$t('system.role.sortNo')" prop="sortNo"><el-input-number v-model="roleForm.sortNo" :min="0" :max="9999" controls-position="right" /></el-form-item>
                <el-form-item v-if="formMode === 'edit'" :label="$t('common.status')" prop="status"><el-select v-model="roleForm.status" style="width:100%"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="$t('system.role.desc')" prop="description"><el-input v-model="roleForm.description" type="textarea" maxlength="500" show-word-limit :placeholder="$t('common.pleaseInput')" /></el-form-item>
            </el-form>
            <template v-if="formMode === 'create' || formMode === 'edit'">
                <el-divider>{{ $t('system.role.assignAuth') }}</el-divider>
                <div class="auth-tree-toolbar">
                    <div class="auth-tree-toolbar__left"><el-button size="small" :icon="Sort" @click="authToggleExpand">{{ authAllExpanded ? $t('system.role.collapseAll') : $t('system.menu.expandCollapse') }}</el-button></div>
                    <div class="auth-tree-toolbar__center"><el-checkbox v-model="authSelectAllChecked" size="small" @change="onAuthSelectAllChange">{{ $t('system.role.selectAll') }}</el-checkbox></div>
                    <div class="auth-tree-toolbar__right"><el-checkbox v-model="authCheckStrictly" size="small">{{ $t('system.role.checkStrictly') }}</el-checkbox></div>
                </div>
                <div class="auth-tree-wrapper" style="max-height:620px">
                    <el-tree ref="authTreeRef" :key="authTreeKey" :data="authTreeData" node-key="id" show-checkbox :default-expand-all="authAllExpanded" :check-strictly="!authCheckStrictly" :props="{ label: 'label', children: 'children', disabled: 'disabled' }" @check="syncAuthSelectAll">
                        <template #default="{ data }">
                            <span class="auth-tree-node">
                                <el-tag v-if="data.type === 'DIR'" size="small" class="auth-tree-tag auth-tree-tag--dir">{{ $t('system.menu.typeCatalog') }}</el-tag>
                                <el-tag v-else-if="data.type === 'MENU'" size="small" type="success" class="auth-tree-tag">{{ $t('system.menu.typeMenu') }}</el-tag>
                                <el-tag v-else-if="data.type === 'BTN'" size="small" type="warning" class="auth-tree-tag">{{ $t('system.menu.typeButton') }}</el-tag>
                                <span class="auth-tree-label">{{ data.label }}</span>
                                <span v-if="data.code" class="auth-tree-code">{{ data.code }}</span>
                            </span>
                        </template>
                    </el-tree>
                </div>
            </template>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="authSaving" @click="submitRoleForm">{{ $t('common.confirm') }}</el-button><el-button @click="roleDialogVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>

        <el-dialog v-model="detailVisible" :title="$t('system.role.roleDetail')" width="760px" append-to-body destroy-on-close>
            <el-descriptions :column="1" border size="small" style="margin-bottom:12px">
                <el-descriptions-item :label="$t('system.role.roleName')">{{ activeRow?.roleName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.roleCode')">{{ activeRow?.roleCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.dataScope')">{{ dataScopeLabel(activeRow?.dataScope) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.roleType')">{{ activeRow?.roleType || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.sortNo')">{{ activeRow?.sortNo ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')"><el-tag :type="activeRow?.status === 1 ? 'success' : 'danger'" size="small">{{ activeRow?.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('common.updateTime')"><BaseDateTime :value="activeRow?.updatedAt" /></el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.menuCount')">{{ activeRow?.menuCount ?? 0 }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.permissionCount')">{{ activeRow?.permissionCount ?? 0 }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.desc')">{{ activeRow?.description || '-' }}</el-descriptions-item>
            </el-descriptions>
            <div class="auth-tree-wrapper" style="max-height:400px">
                <el-tree :data="detailTreeData" node-key="id" show-checkbox default-expand-all :default-checked-keys="detailCheckedKeys" :props="{ label: 'label', children: 'children', disabled: 'disabled' }" disabled>
                    <template #default="{ data }">
                        <span class="auth-tree-node">
                            <el-tag v-if="data.type === 'DIR'" size="small" class="auth-tree-tag auth-tree-tag--dir">{{ $t('system.menu.typeCatalog') }}</el-tag>
                            <el-tag v-else-if="data.type === 'MENU'" size="small" type="success" class="auth-tree-tag">{{ $t('system.menu.typeMenu') }}</el-tag>
                            <el-tag v-else-if="data.type === 'BTN'" size="small" type="warning" class="auth-tree-tag">{{ $t('system.menu.typeButton') }}</el-tag>
                            <span class="auth-tree-label">{{ data.label }}</span>
                            <span v-if="data.code" class="auth-tree-code">{{ data.code }}</span>
                        </span>
                    </template>
                </el-tree>
            </div>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog v-model="roleAuthVisible" :title="$t('system.role.roleAuth')" width="760px" append-to-body destroy-on-close>
            <el-descriptions :column="1" border size="small" style="margin-bottom:12px">
                <el-descriptions-item :label="$t('system.role.roleName')">{{ activeRow?.roleName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.roleCode')">{{ activeRow?.roleCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.role.dataScope')">{{ dataScopeLabel(activeRow?.dataScope) }}</el-descriptions-item>
            </el-descriptions>
            <div class="auth-tree-toolbar">
                <div class="auth-tree-toolbar__left">
                    <el-button size="small" :icon="Sort" @click="authToggleExpand">{{ authAllExpanded ? $t('system.role.collapseAll') : $t('system.menu.expandCollapse') }}</el-button>
                </div>
                <div class="auth-tree-toolbar__center">
                    <el-checkbox v-model="authSelectAllChecked" size="small" @change="onAuthSelectAllChange">{{ $t('system.role.selectAll') }}</el-checkbox>
                </div>
                <div class="auth-tree-toolbar__right">
                    <el-checkbox v-model="authCheckStrictly" size="small">{{ $t('system.role.checkStrictly') }}</el-checkbox>
                </div>
            </div>
            <div v-loading="authLoading" class="auth-tree-wrapper" style="max-height:620px">
                <el-tree
                    ref="authTreeRef"
                    :key="authTreeKey"
                    :data="authTreeData"
                    node-key="id"
                    show-checkbox
                    :default-expand-all="authAllExpanded"
                    :check-strictly="!authCheckStrictly"
                    :default-checked-keys="authCheckedKeys"
                    :props="{ label: 'label', children: 'children', disabled: 'disabled' }"
                >
                    <template #default="{ data }">
                        <span class="auth-tree-node">
                            <el-tag v-if="data.type === 'DIR'" size="small" class="auth-tree-tag auth-tree-tag--dir">{{ $t('system.menu.typeCatalog') }}</el-tag>
                            <el-tag v-else-if="data.type === 'MENU'" size="small" type="success" class="auth-tree-tag">{{ $t('system.menu.typeMenu') }}</el-tag>
                            <el-tag v-else-if="data.type === 'BTN'" size="small" type="warning" class="auth-tree-tag">{{ $t('system.menu.typeButton') }}</el-tag>
                            <span class="auth-tree-label">{{ data.label }}</span>
                            <span v-if="data.code" class="auth-tree-code">{{ data.code }}</span>
                        </span>
                    </template>
                </el-tree>
            </div>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="authSaving" @click="submitRoleAuth">{{ $t('common.confirm') }}</el-button><el-button @click="roleAuthVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, View, Key, Sort } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { createRole, deleteRole, getRoleMenus, grantRoleMenus, searchRoles, updateRole, updateRoleStatus, type SysRole } from '@/api/system/role';
import { treeMenus, type SysMenu } from '@/api/system/menu';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { CommonStatus } from '@/enums/status';

const { t } = useI18n();
interface RoleRow extends SysRole { statusTag: CommonStatus; }
interface RoleForm { roleId?: number; roleCode: string; roleName: string; dataScope: string; description: string; status: number; sortNo: number; }
interface AuthTreeNode { id: string; label: string; code?: string; type?: 'DIR' | 'MENU' | 'BTN'; children?: AuthTreeNode[]; disabled?: boolean }

const statusOptions = [{ label: t('common.enable'), value: 1 }, { label: t('common.disable'), value: 0 }];
const showSearch = ref(true);
const query = reactive<Record<string, unknown>>({}); const queryFormRef = ref<FormInstance>();
const loading = ref(false); const rows = ref<RoleRow[]>([]); const total = ref(0); const page = ref(1); const pageSize = ref(10);
const selectedRows = ref<RoleRow[]>([]);
const detailVisible = ref(false); const roleDialogVisible = ref(false); const roleAuthVisible = ref(false);
const authLoading = ref(false); const authSaving = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeRow = ref<RoleRow | null>(null);
const roleFormRef = ref<FormInstance>();
const authTreeRef = ref<{ getCheckedKeys: (leafOnly?: boolean) => Array<string|number>; getHalfCheckedKeys: () => Array<string|number>; setCheckedKeys: (keys: Array<string|number>) => void; filter: (keyword: string) => void }>();
const authTreeData = ref<AuthTreeNode[]>([]);
const authCheckedKeys = ref<string[]>([]);
const detailTreeData = ref<AuthTreeNode[]>([]); const detailCheckedKeys = ref<string[]>([]);
const authCheckStrictly = ref(true);
const authSelectAllChecked = ref(false);
const authAllExpanded = ref(true);
const authTreeKey = ref(0);
const dialogTitle = computed(() => formMode.value === 'create' ? t('system.role.addRole') : t('system.role.editRole'));
const roleForm = reactive<RoleForm>({ roleCode: '', roleName: '', dataScope: 'SELF', description: '', status: 1, sortNo: 100 });
const roleFormRules: FormRules = { roleCode: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }], roleName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }] };

watch([page, pageSize], () => { loadData(); });
onMounted(() => { loadData(); });

async function loadData() { loading.value = true; try { const r = await searchRoles({ pageNo: page.value, pageSize: pageSize.value, roleCode: tv(query.roleCode), roleName: tv(query.roleName), status: ns() }); rows.value = r.records.map(nr); total.value = r.total; } catch (e) { rows.value = []; total.value = 0; ElMessage.error(e instanceof Error ? e.message : t('common.loadFailed')); } finally { loading.value = false; } }
function handleQuery() { page.value === 1 ? loadData() : (page.value = 1); }
function resetQuery() { Object.keys(query).forEach(k => query[k] = ''); handleQuery(); }
function handleSelectionChange(s: RoleRow[]) { selectedRows.value = s; }
async function handleAdd() { formMode.value = 'create'; activeRow.value = null; Object.assign(roleForm, { roleId: undefined, roleCode: '', roleName: '', dataScope: 'SELF', description: '', status: 1, sortNo: 100 }); authTreeData.value = []; authSelectAllChecked.value = false; authCheckStrictly.value = true; authAllExpanded.value = true; roleDialogVisible.value = true; nextTick(() => roleFormRef.value?.clearValidate()); try { const allMenus = await treeMenus({}); authTreeData.value = buildAuthTree(allMenus || []); await nextTick(); syncAuthSelectAll(); } catch { /* empty tree */ } }
async function handleUpdate(row: RoleRow) { formMode.value = 'edit'; activeRow.value = row; Object.assign(roleForm, { roleId: row.roleId, roleCode: row.roleCode, roleName: row.roleName, dataScope: row.dataScope || 'SELF', description: row.description || '', status: row.status ?? 1, sortNo: row.sortNo ?? 100 }); authSelectAllChecked.value = false; authCheckStrictly.value = true; authAllExpanded.value = true; roleDialogVisible.value = true; nextTick(() => roleFormRef.value?.clearValidate()); try { const menusRes = await getRoleMenus({ roleId: row.roleId }); authTreeData.value = buildAuthTree(menusRes.menus || []); await nextTick(); authTreeRef.value?.setCheckedKeys((menusRes.checkedMenuIds || []).map((id: number) => 'm_' + id)); syncAuthSelectAll(); } catch { /* keep empty */ } }
async function openDetail(row: RoleRow) { activeRow.value = row; detailVisible.value = true; detailTreeData.value = []; detailCheckedKeys.value = []; try { const m = await getRoleMenus({ roleId: row.roleId }); detailTreeData.value = buildAuthTree(m.menus || []); detailCheckedKeys.value = (m.checkedMenuIds || []).map((id: number) => 'm_' + id); } catch { /* keep empty */ } }
async function submitRoleForm() { const v = await roleFormRef.value?.validate().catch(() => false); if (!v) return; authSaving.value = true; try { if (formMode.value === 'create') { const created = await createRole({ roleCode: roleForm.roleCode.trim(), roleName: roleForm.roleName.trim(), dataScope: roleForm.dataScope, description: to(roleForm.description), sortNo: roleForm.sortNo }); if (authTreeRef.value && created.roleId) { await grantRoleMenus({ roleId: created.roleId, menuIds: getSelectedMenuIds() }); } ElMessage.success(t('common.addSuccess')); } else if (roleForm.roleId) { await updateRole({ roleId: roleForm.roleId, roleName: roleForm.roleName.trim(), dataScope: roleForm.dataScope, description: to(roleForm.description), status: roleForm.status, sortNo: roleForm.sortNo }); if (authTreeRef.value) { await grantRoleMenus({ roleId: roleForm.roleId, menuIds: getSelectedMenuIds() }); } ElMessage.success(t('common.editSuccess')); } roleDialogVisible.value = false; loadData(); } catch (e) { ElMessage.error(e instanceof Error ? e.message : t('common.saveFailed')); } finally { authSaving.value = false; } }
async function handleStatusChange(row: RoleRow) { const ns = row.status === 1 ? 0 : 1; const at = ns === 1 ? t('common.enable') : t('common.disable'); try { await ElMessageBox.confirm(t('system.role.statusToggleConfirm', { action: at, name: row.roleName }), t('common.confirm'), { type: ns === 1 ? 'success' : 'warning' }); await updateRoleStatus({ roleId: row.roleId, status: ns }); ElMessage.success(t('common.success')); loadData(); } catch (e) { if (e instanceof Error) ElMessage.error(e.message); } }
async function handleDelete(rp?: RoleRow[]) { const ts = rp ?? selectedRows.value; if (!ts.length) { ElMessage.warning(t('common.pleaseSelect')); return; } const sr = ts.filter(r => r.roleType === 'SYSTEM'); if (sr.length) { ElMessage.warning(t('system.role.systemRoleNoDelete')); return; } const ns = ts.map(r => r.roleName).join('、'); try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: ns }), t('common.delete'), { type: 'warning' }); for (const t of ts) { await deleteRole({ roleId: t.roleId }); } ElMessage.success(t('common.deleteSuccess')); loadData(); } catch (e) { if (e instanceof Error) ElMessage.error(e.message); } }
async function removeRole(row: RoleRow) { try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: row.roleName }), t('common.delete'), { type: 'warning' }); await deleteRole({ roleId: row.roleId }); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch (e) { if (e instanceof Error) ElMessage.error(e.message); } }

async function openRoleAuth(row: RoleRow) {
    activeRow.value = row; roleAuthVisible.value = true; authLoading.value = true; authCheckStrictly.value = true; authSelectAllChecked.value = false; authAllExpanded.value = true;
    try {
        const menusRes = await getRoleMenus({ roleId: row.roleId });
        authTreeData.value = buildAuthTree(menusRes.menus || []);
        authCheckedKeys.value = (menusRes.checkedMenuIds || []).map((id: number) => 'm_' + id);
        await nextTick(); syncAuthSelectAll();
    } catch (e) { ElMessage.error(e instanceof Error ? e.message : t('common.loadFailed')); roleAuthVisible.value = false; }
    finally { authLoading.value = false; }
}
function buildAuthTree(menus: SysMenu[]): AuthTreeNode[] {
    return menus.map(m => {
        const children = m.children ? buildAuthTree(m.children) : [];
        return {
            id: 'm_' + (m.menuId || 0),
            label: m.menuName || '',
            code: m.permissionCode ? '(' + m.permissionCode + ')' : undefined,
            type: (m.menuType === 'CATALOG' ? 'DIR' : m.menuType === 'BUTTON' ? 'BTN' : 'MENU') as 'DIR' | 'MENU' | 'BTN',
            children: children.length ? children : undefined,
        };
    });
}
function getSelectedMenuIds() {
    const checked = authTreeRef.value?.getCheckedKeys() || [];
    const halfChecked = authTreeRef.value?.getHalfCheckedKeys() || [];
    return ni([...checked, ...halfChecked].filter(k => String(k).startsWith('m_')).map(k => Number(String(k).replace('m_', ''))));
}
async function submitRoleAuth() {
    if (!activeRow.value || authSaving.value) return; authSaving.value = true;
    try {
        const ck = authTreeRef.value?.getCheckedKeys() || []; const hk = authTreeRef.value?.getHalfCheckedKeys() || [];
        const allKeys = [...ck, ...hk];
        await grantRoleMenus({ roleId: activeRow.value.roleId, menuIds: ni(allKeys.filter(k => String(k).startsWith('m_')).map(k => Number(String(k).replace('m_', '')))) });
        ElMessage.success(t('common.saveSuccess')); roleAuthVisible.value = false; loadData();
    } catch (e) { ElMessage.error(e instanceof Error ? e.message : t('common.saveFailed')); }
    finally { authSaving.value = false; }
}
function authToggleExpand() {
    const selectedKeys = authTreeRef.value
        ? [...authTreeRef.value.getCheckedKeys(), ...authTreeRef.value.getHalfCheckedKeys()]
        : [];
    authAllExpanded.value = !authAllExpanded.value;
    authTreeKey.value++;
    nextTick(() => {
        authTreeRef.value?.setCheckedKeys(Array.from(new Set(selectedKeys)));
        syncAuthSelectAll();
    });
}
function onAuthSelectAllChange(val: boolean) { if (authTreeRef.value) { authTreeRef.value.setCheckedKeys(val ? authTreeData.value.flatMap(collectKeys) : []); } authSelectAllChecked.value = val; }
function collectKeys(node: AuthTreeNode): string[] { return [node.id, ...(node.children || []).flatMap(collectKeys)]; }
function syncAuthSelectAll() { const allKeys = authTreeData.value.flatMap(collectKeys); const checked = authTreeRef.value?.getCheckedKeys() || []; authSelectAllChecked.value = allKeys.length > 0 && allKeys.every(k => checked.includes(k)); }

function tv(v: unknown) { return String(v || '').trim() || undefined; }
function ns() { return typeof query.status === 'number' ? query.status : undefined; }
function nr(row: SysRole): RoleRow { return { ...row, statusTag: row.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled }; }
function to(v: string) { return v.trim() || undefined; }
function ni(keys: Array<string | number>) { return Array.from(new Set(keys.map(Number).filter(i => Number.isInteger(i) && i > 0))); }
function dataScopeLabel(v?: string) { const m: Record<string, string> = { ALL: t('system.role.allData'), SELF: t('system.role.selfData'), CUSTOM: t('system.role.customData') }; return v ? (m[v] || v) : '-'; }
</script>
