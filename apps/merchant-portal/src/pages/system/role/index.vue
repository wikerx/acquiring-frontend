<template>
    <div class="page system-page">
        <el-form :model="query" inline size="small" class="search-form">
            <el-form-item :label="t('system.role.name')"><el-input v-model="query.roleName" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item :label="t('system.role.code')"><el-input v-model="query.roleCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.status" :placeholder="t('common.all')" clearable>
                    <el-option :label="t('common.enabled')" :value="1" />
                    <el-option :label="t('common.disabled')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('system.role.createdTime')">
                <el-date-picker v-model="query.createdRange" type="daterange" :start-placeholder="t('system.role.startDate')" :end-placeholder="t('system.role.endDate')" value-format="YYYY-MM-DD" clearable />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <div class="toolbar">
            <el-button v-if="canAdd" type="primary" plain size="small" :icon="Plus" @click="openEdit()">{{ t('system.role.add') }}</el-button>
            <el-button plain size="small" :icon="Refresh" @click="loadData">{{ t('common.refresh') }}</el-button>
        </div>

        <el-table v-loading="loading" :data="rows" row-key="roleId" size="small">
            <el-table-column prop="roleName" :label="t('system.role.name')" min-width="150" show-overflow-tooltip />
            <el-table-column prop="roleCode" :label="t('system.role.code')" min-width="180" show-overflow-tooltip />
            <el-table-column :label="t('system.role.dataScope')" width="110" align="center"><template #default="{ row }">{{ dataScopeLabel(row.dataScope) }}</template></el-table-column>
            <el-table-column :label="t('common.status')" width="120" align="center">
                <template #default="{ row }">
                    <el-switch v-if="canChangeStatus" :model-value="row.status" :active-value="1" :inactive-value="0" @change="changeStatus(row)" />
                    <el-tag v-else :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? t('common.enabled') : t('common.disabled') }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="sortNo" :label="t('common.sortNo')" width="80" align="center" />
            <el-table-column :label="t('system.role.updatedTime')" min-width="170" align="center"><template #default="{ row }">{{ formatTime(row.updatedAt) }}</template></el-table-column>
            <el-table-column :label="t('common.operation')" width="260" align="center" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button v-if="canDetail" size="small" link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                    <el-button v-if="canEdit" size="small" link type="primary" :icon="Edit" @click="openEdit(row)">{{ t('common.edit') }}</el-button>
                    <el-button v-if="canGrant" size="small" link type="primary" :icon="Key" @click="openGrant(row)">{{ t('system.role.grant') }}</el-button>
                    <el-button v-if="canDelete" size="small" link type="danger" :icon="Delete" :disabled="isSystemRole(row)" @click="remove(row)">{{ t('common.delete') }}</el-button>
                    <span v-if="!canDetail && !canEdit && !canGrant && !canDelete">-</span>
                </template>
            </el-table-column>
        </el-table>
        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog v-model="detailVisible" :title="t('system.role.detailTitle')" width="760px" append-to-body destroy-on-close>
            <el-descriptions :column="1" border size="small" class="role-desc">
                <el-descriptions-item :label="t('system.role.name')">{{ activeRole?.roleName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.role.code')">{{ activeRole?.roleCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.role.dataScope')">{{ dataScopeLabel(activeRole?.dataScope) }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.role.roleStatus')"><el-tag :type="activeRole?.status === 1 ? 'success' : 'info'" size="small">{{ activeRole?.status === 1 ? t('common.enabled') : t('common.disabled') }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('common.sortNo')">{{ activeRole?.sortNo ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.role.createdTime')">{{ formatTime(activeRole?.createdAt) }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.role.updatedTime')">{{ formatTime(activeRole?.updatedAt) }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.role.description')">{{ activeRole?.description || '-' }}</el-descriptions-item>
            </el-descriptions>
            <div v-loading="grantLoading" class="grant-tree-box">
                <el-tree :data="grantTree" node-key="id" show-checkbox default-expand-all :default-checked-keys="checkedKeys" :props="{ label: 'name', children: 'children' }" disabled>
                    <template #default="{ data }"><GrantTreeNode :node="data" /></template>
                </el-tree>
            </div>
            <template #footer><el-button @click="detailVisible = false">{{ t('common.close') }}</el-button></template>
        </el-dialog>

        <el-dialog v-model="editVisible" :title="form.roleId ? t('system.role.edit') : t('system.role.add')" width="840px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
                <el-row :gutter="12">
                    <el-col :span="12"><el-form-item :label="t('system.role.name')" prop="roleName"><el-input v-model="form.roleName" maxlength="100" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="t('system.role.code')" prop="roleCode"><el-input v-model="form.roleCode" :disabled="Boolean(form.roleId) && isSystemForm" maxlength="80" /></el-form-item></el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.role.dataScope')" prop="dataScope">
                            <el-select v-model="form.dataScope" style="width:100%">
                                <el-option :label="t('system.role.dataAll')" value="ALL" />
                                <el-option :label="t('system.role.dataSelf')" value="SELF" />
                                <el-option :label="t('system.role.dataCustom')" value="CUSTOM" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6"><el-form-item :label="t('common.sortNo')" prop="sortNo"><el-input-number v-model="form.sortNo" :min="0" :max="9999" controls-position="right" /></el-form-item></el-col>
                    <el-col :span="6">
                        <el-form-item :label="t('common.status')" prop="status">
                            <el-select v-model="form.status" style="width:100%">
                                <el-option :label="t('common.enabled')" :value="1" />
                                <el-option :label="t('common.disabled')" :value="0" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('system.role.description')"><el-input v-model="form.description" type="textarea" maxlength="500" show-word-limit /></el-form-item>
            </el-form>
            <el-divider>{{ t('system.role.menuPermission') }}</el-divider>
            <div class="grant-toolbar">
                <el-button size="small" :icon="Sort" @click="toggleFormExpand">{{ formExpanded ? t('system.role.collapse') : t('system.role.expand') }}</el-button>
                <el-checkbox v-model="formSelectAllChecked" size="small" @change="toggleFormSelectAll">{{ t('system.role.selectAll') }}</el-checkbox>
                <el-checkbox v-model="formParentLinked" size="small">{{ t('system.role.parentLinked') }}</el-checkbox>
            </div>
            <div v-loading="grantLoading" class="grant-tree-box grant-tree-box--form">
                <el-tree
                    ref="formGrantTreeRef"
                    :key="formTreeKey"
                    :data="grantTree"
                    node-key="id"
                    show-checkbox
                    check-on-click-node
                    :default-expand-all="formExpanded"
                    :default-checked-keys="checkedKeys"
                    :check-strictly="!formParentLinked"
                    :props="{ label: 'name', children: 'children' }"
                    @check="syncFormSelectAll"
                >
                    <template #default="{ data }"><GrantTreeNode :node="data" /></template>
                </el-tree>
            </div>
            <template #footer>
                <el-button size="small" @click="editVisible = false">{{ t('common.cancel') }}</el-button>
                <el-button type="primary" size="small" :loading="saving" @click="submitEdit">{{ t('common.save') }}</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="grantVisible" :title="t('system.role.grantTitle')" width="820px" append-to-body destroy-on-close>
            <el-descriptions :column="3" border size="small" class="role-desc">
                <el-descriptions-item :label="t('system.role.name')">{{ activeRole?.roleName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.role.code')">{{ activeRole?.roleCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.role.dataScope')">{{ dataScopeLabel(activeRole?.dataScope) }}</el-descriptions-item>
            </el-descriptions>
            <div class="grant-toolbar">
                <el-button size="small" :icon="Sort" @click="toggleExpand">{{ expanded ? t('system.role.collapse') : t('system.role.expand') }}</el-button>
                <el-checkbox v-model="selectAllChecked" size="small" @change="toggleSelectAll">{{ t('system.role.selectAll') }}</el-checkbox>
                <el-checkbox v-model="parentLinked" size="small">{{ t('system.role.parentLinked') }}</el-checkbox>
            </div>
            <div v-loading="grantLoading" class="grant-tree-box">
                <el-tree
                    ref="grantTreeRef"
                    :key="treeKey"
                    :data="grantTree"
                    node-key="id"
                    show-checkbox
                    check-on-click-node
                    :default-expand-all="expanded"
                    :default-checked-keys="checkedKeys"
                    :check-strictly="!parentLinked"
                    :props="{ label: 'name', children: 'children' }"
                    @check="syncSelectAll"
                >
                    <template #default="{ data }"><GrantTreeNode :node="data" /></template>
                </el-tree>
            </div>
            <template #footer>
                <el-button size="small" @click="grantVisible = false">{{ t('common.cancel') }}</el-button>
                <el-button type="primary" size="small" :loading="saving" @click="submitGrant">{{ t('common.confirm') }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, ElTag, type ElTree, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Edit, Key, Plus, Refresh, RefreshLeft, Search, Sort, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { systemApi, type RoleGrantNode, type RoleItem } from '@/api/systemApi';
import { hasAnyPermission, hasPermission } from '@/utils/permission';

interface RoleForm {
    roleId?: number;
    roleCode: string;
    roleName: string;
    dataScope: string;
    description?: string;
    status: number;
    sortNo: number;
    roleType?: string;
}

const GrantTreeNode = defineComponent({
    name: 'GrantTreeNode',
    props: { node: { type: Object as () => RoleGrantNode, required: true } },
    setup(props) {
        return () => h('span', { class: 'grant-node' }, [
            h(ElTag, { size: 'small', type: tagType(props.node.nodeType), class: 'grant-node__tag' }, () => nodeTypeName(props.node.nodeType)),
            h('span', { class: 'grant-node__name' }, props.node.name),
            props.node.code ? h('code', { class: 'grant-node__code' }, props.node.code) : null,
        ]);
    },
});

const { t } = useI18n();
const loading = ref(false);
const detailVisible = ref(false);
const editVisible = ref(false);
const grantVisible = ref(false);
const grantLoading = ref(false);
const saving = ref(false);
const rows = ref<RoleItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const query = reactive<{ roleName?: string; roleCode?: string; status?: number; createdRange?: [string, string] }>({});
const form = reactive<RoleForm>({ roleCode: '', roleName: '', dataScope: 'SELF', description: '', status: 1, sortNo: 100 });
const formRef = ref<FormInstance>();
const grantTreeRef = ref<InstanceType<typeof ElTree>>();
const formGrantTreeRef = ref<InstanceType<typeof ElTree>>();
const activeRole = ref<RoleItem>();
const grantTree = ref<RoleGrantNode[]>([]);
const checkedKeys = ref<string[]>([]);
const grantNodeMap = ref<Map<string, RoleGrantNode>>(new Map());
const expanded = ref(true);
const parentLinked = ref(true);
const selectAllChecked = ref(false);
const treeKey = ref(0);
const formExpanded = ref(true);
const formParentLinked = ref(true);
const formSelectAllChecked = ref(false);
const formTreeKey = ref(0);

const canAdd = hasPermission('merchant:system:role:add');
const canDetail = hasPermission('merchant:system:role:detail');
const canEdit = hasPermission('merchant:system:role:edit');
const canDelete = hasPermission('merchant:system:role:delete');
const canChangeStatus = hasPermission('merchant:system:role:status');
const canGrant = hasAnyPermission(['merchant:system:role:grant', 'merchant:system:role:grantMenu', 'merchant:system:role:grantPermission']);
const isSystemForm = computed(() => form.roleType === 'SYSTEM');
const rules = computed<FormRules>(() => ({
    roleName: [{ required: true, message: t('system.role.nameRequired'), trigger: 'blur' }],
    roleCode: [{ required: true, message: t('system.role.codeRequired'), trigger: 'blur' }],
}));

onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        const result = await systemApi.pageRoles({
            pageNo: page.value,
            pageSize: pageSize.value,
            roleName: query.roleName?.trim() || undefined,
            roleCode: query.roleCode?.trim() || undefined,
            status: query.status,
            createdStartTime: query.createdRange?.[0],
            createdEndTime: query.createdRange?.[1],
        });
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

function applyQuery() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    query.roleName = undefined;
    query.roleCode = undefined;
    query.status = undefined;
    query.createdRange = undefined;
    applyQuery();
}

async function openDetail(row: RoleItem) {
    activeRole.value = await systemApi.roleDetail(row.roleId);
    detailVisible.value = true;
    await loadGrant(activeRole.value.roleId);
}

async function openEdit(row?: RoleItem) {
    Object.assign(form, row ? {
        roleId: row.roleId,
        roleCode: row.roleCode,
        roleName: row.roleName,
        dataScope: row.dataScope || 'SELF',
        description: row.description || '',
        status: row.status,
        sortNo: row.sortNo ?? 100,
        roleType: row.roleType,
    } : { roleId: undefined, roleCode: '', roleName: '', dataScope: 'SELF', description: '', status: 1, sortNo: 100, roleType: undefined });
    resetGrantState();
    formExpanded.value = true;
    formParentLinked.value = true;
    editVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
    if (canGrant) {
        await loadGrant(row?.roleId);
        formGrantTreeRef.value?.setCheckedKeys(checkedKeys.value, false);
        syncFormSelectAll();
    }
}

async function openGrant(row: RoleItem) {
    activeRole.value = row;
    grantVisible.value = true;
    expanded.value = true;
    parentLinked.value = true;
    await loadGrant(row.roleId);
}

async function loadGrant(roleId?: number) {
    grantLoading.value = true;
    try {
        const data = roleId ? await systemApi.roleGrantTree(roleId) : await systemApi.roleGrantTreeTemplate();
        activeRole.value = data.role || activeRole.value;
        grantTree.value = data.tree || [];
        grantNodeMap.value = buildNodeMap(grantTree.value);
        checkedKeys.value = [
            ...(data.checkedMenuIds || []).map((id) => `m_${id}`),
            ...(data.checkedPermissionIds || []).map((id) => `p_${id}`),
        ];
        treeKey.value++;
        await nextTick();
        grantTreeRef.value?.setCheckedKeys(checkedKeys.value, false);
        syncSelectAll();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('system.role.grantTreeLoadFailed'));
    } finally {
        grantLoading.value = false;
    }
}

async function submitEdit() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid || saving.value) return;
    saving.value = true;
    try {
        const payload = {
            roleCode: form.roleCode.trim(),
            roleName: form.roleName.trim(),
            dataScope: form.dataScope,
            description: form.description?.trim(),
            status: form.status,
            sortNo: form.sortNo,
            ...(canGrant ? selectedGrantIds(formGrantTreeRef.value) : {}),
        };
        await systemApi.saveRole(payload, form.roleId);
        ElMessage.success(t('common.saveSuccess'));
        editVisible.value = false;
        await loadData();
    } finally {
        saving.value = false;
    }
}

async function submitGrant() {
    if (!activeRole.value || saving.value) return;
    saving.value = true;
    try {
        const selection = selectedGrantIds(grantTreeRef.value);
        await systemApi.saveRoleGrantTree(activeRole.value.roleId, selection.menuIds, selection.permissionIds);
        ElMessage.success(t('system.role.grantSaved'));
        grantVisible.value = false;
        await loadData();
    } finally {
        saving.value = false;
    }
}

async function changeStatus(row: RoleItem) {
    const nextStatus = row.status === 1 ? 0 : 1;
    await ElMessageBox.confirm(
        t('system.role.changeStatusConfirm', { status: nextStatus === 1 ? t('common.enabled') : t('common.disabled'), name: row.roleName }),
        t('common.statusConfirmTitle'),
        { type: nextStatus === 1 ? 'success' : 'warning' },
    );
    await systemApi.changeRoleStatus(row.roleId, nextStatus);
    ElMessage.success(t('common.operationSuccess'));
    await loadData();
}

async function remove(row: RoleItem) {
    if (isSystemRole(row)) return;
    await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: row.roleName }), t('common.deleteConfirmTitle'), { type: 'warning' });
    await systemApi.deleteRole(row.roleId);
    ElMessage.success(t('common.deleteSuccess'));
    await loadData();
}

function toggleExpand() {
    const keys = selectedKeys(grantTreeRef.value);
    expanded.value = !expanded.value;
    treeKey.value++;
    nextTick(() => {
        grantTreeRef.value?.setCheckedKeys(keys, false);
        syncSelectAll();
    });
}

function toggleSelectAll(value: boolean) {
    grantTreeRef.value?.setCheckedKeys(value ? grantTree.value.flatMap(collectKeys) : [], false);
    selectAllChecked.value = value;
}

function syncSelectAll() {
    const allKeys = grantTree.value.flatMap(collectKeys);
    const checked = grantTreeRef.value?.getCheckedKeys(false).map(String) || [];
    selectAllChecked.value = allKeys.length > 0 && allKeys.every((key) => checked.includes(key));
}

function toggleFormExpand() {
    const keys = selectedKeys(formGrantTreeRef.value);
    formExpanded.value = !formExpanded.value;
    formTreeKey.value++;
    nextTick(() => {
        formGrantTreeRef.value?.setCheckedKeys(keys, false);
        syncFormSelectAll();
    });
}

function toggleFormSelectAll(value: boolean) {
    formGrantTreeRef.value?.setCheckedKeys(value ? grantTree.value.flatMap(collectKeys) : [], false);
    formSelectAllChecked.value = value;
}

function syncFormSelectAll() {
    const allKeys = grantTree.value.flatMap(collectKeys);
    const checked = formGrantTreeRef.value?.getCheckedKeys(false).map(String) || [];
    formSelectAllChecked.value = allKeys.length > 0 && allKeys.every((key) => checked.includes(key));
}

function selectedKeys(tree?: InstanceType<typeof ElTree>) {
    const checked = tree?.getCheckedKeys(false).map(String) || [];
    const halfChecked = tree?.getHalfCheckedKeys().map(String) || [];
    return Array.from(new Set([...checked, ...halfChecked]));
}

function selectedGrantIds(tree?: InstanceType<typeof ElTree>) {
    const menuIds = new Set<number>();
    const permissionIds = new Set<number>();
    selectedKeys(tree).forEach((key) => {
        const node = grantNodeMap.value.get(key);
        if (!node) return;
        if (node.menuId) {
            menuIds.add(node.menuId);
        }
        if (node.permissionId) {
            permissionIds.add(node.permissionId);
        }
    });
    return {
        menuIds: Array.from(menuIds),
        permissionIds: Array.from(permissionIds),
    };
}

function resetGrantState() {
    grantTree.value = [];
    checkedKeys.value = [];
    grantNodeMap.value = new Map();
    selectAllChecked.value = false;
    formSelectAllChecked.value = false;
    treeKey.value++;
    formTreeKey.value++;
}

function collectKeys(node: RoleGrantNode): string[] {
    return [node.id, ...(node.children || []).flatMap(collectKeys)];
}

function buildNodeMap(nodes: RoleGrantNode[]) {
    const map = new Map<string, RoleGrantNode>();
    const visit = (items: RoleGrantNode[]) => {
        items.forEach((item) => {
            map.set(item.id, item);
            visit(item.children || []);
        });
    };
    visit(nodes);
    return map;
}

function isSystemRole(row?: RoleItem) {
    return row?.roleType === 'SYSTEM' || row?.roleCode?.startsWith('MERCHANT_ADMIN_') || row?.roleCode === 'MERCHANT_ADMIN';
}

function dataScopeLabel(value?: string) {
    const labels: Record<string, string> = { ALL: t('system.role.dataAll'), SELF: t('system.role.dataSelf'), CUSTOM: t('system.role.dataCustom') };
    return value ? labels[value] || value : '-';
}

function formatTime(value?: string) {
    return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function nodeTypeName(value?: string) {
    const labels: Record<string, string> = { DIR: t('system.role.dir'), MENU: t('system.role.menu'), BTN: t('system.role.button') };
    return value ? labels[value] || value : '-';
}

function tagType(value?: string) {
    if (value === 'MENU') return 'success';
    if (value === 'BTN') return 'warning';
    return 'primary';
}
</script>

<style scoped>
.search-form :deep(.el-date-editor) {
    width: 240px;
}

.role-desc {
    margin-bottom: 12px;
}

.grant-toolbar {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 10px;
}

.grant-tree-box {
    min-height: 520px;
    max-height: 640px;
    overflow: auto;
    padding: 10px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
}

.grant-tree-box--form {
    min-height: 360px;
    max-height: 460px;
}

:deep(.grant-node) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

:deep(.grant-node__tag) {
    min-width: 42px;
    justify-content: center;
}

:deep(.grant-node__code) {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}
</style>
