<template>
    <div class="page system-page role-auth-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form">
            <el-form-item :label="t('system.role.name')"><el-input v-model="query.roleName" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item :label="t('system.role.code')"><el-input v-model="query.roleCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.status" :placeholder="t('common.all')" clearable>
                    <el-option :label="t('common.enabled')" :value="1" />
                    <el-option :label="t('common.disabled')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <div class="toolbar">
            <div class="role-auth-summary">
                <el-tag size="small" effect="plain">{{ t('system.roleAuth.permissionModel') }}</el-tag>
                <span>{{ t('system.roleAuth.description') }}</span>
            </div>
            <div class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></div>
        </div>

        <StandardTable table-key="merchant-system-role-auth" v-loading="loading" :data="rows" row-key="roleId" size="small">
            <el-table-column prop="roleName" :label="t('system.role.name')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="roleCode" :label="t('system.role.code')" min-width="190" show-overflow-tooltip />
            <el-table-column :label="t('system.role.dataScope')" width="120" align="center"><template #default="{ row }">{{ dataScopeLabel(row.dataScope) }}</template></el-table-column>
            <el-table-column :label="t('common.status')" width="110" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? t('common.enabled') : t('common.disabled') }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="t('system.role.updatedTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updatedAt" /></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="160" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button v-if="canGrant" size="small" link type="primary" :icon="Key" @click="openGrant(row)">{{ t('system.roleAuth.authAction') }}</el-button>
                    <span v-else>-</span>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog v-model="grantVisible" :title="t('system.roleAuth.grantTitle')" width="840px" append-to-body destroy-on-close>
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
                <div class="dialog-footer">
                    <el-button type="primary" size="small" :loading="saving" @click="submitGrant">{{ t('common.confirm') }}</el-button>
                    <el-button size="small" @click="grantVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { defineComponent, h, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElTag, type ElTree } from 'element-plus';
import { Key, RefreshLeft, Search, Sort } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { systemApi, type RoleGrantNode, type RoleItem } from '@/api/systemApi';
import { resolveMerchantMenuLabel } from '@/utils/menu';
import { hasAnyPermission } from '@/utils/permission';

const GrantTreeNode = defineComponent({
    name: 'GrantTreeNode',
    props: { node: { type: Object as () => RoleGrantNode, required: true } },
    setup(props) {
        return () => h('span', { class: 'grant-node' }, [
            h(ElTag, { size: 'small', type: tagType(props.node.nodeType), class: 'grant-node__tag' }, () => nodeTypeName(props.node.nodeType)),
            h('span', { class: 'grant-node__name' }, grantNodeLabel(props.node)),
            props.node.code ? h('code', { class: 'grant-node__code' }, props.node.code) : null,
        ]);
    },
});

const { t } = useI18n();
const loading = ref(false);
const showSearch = ref(true);
const grantVisible = ref(false);
const grantLoading = ref(false);
const saving = ref(false);
const rows = ref<RoleItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const query = reactive<{ roleName?: string; roleCode?: string; status?: number }>({});
const activeRole = ref<RoleItem>();
const grantTreeRef = ref<InstanceType<typeof ElTree>>();
const grantTree = ref<RoleGrantNode[]>([]);
const checkedKeys = ref<string[]>([]);
const grantNodeMap = ref<Map<string, RoleGrantNode>>(new Map());
const expanded = ref(true);
const parentLinked = ref(true);
const selectAllChecked = ref(false);
const treeKey = ref(0);
const canGrant = hasAnyPermission(['merchant:system:role:grant', 'merchant:system:role:grantMenu', 'merchant:system:role:grantPermission']);

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
    applyQuery();
}

async function openGrant(row: RoleItem) {
    activeRole.value = row;
    grantVisible.value = true;
    expanded.value = true;
    parentLinked.value = true;
    await loadGrant(row.roleId);
}

async function loadGrant(roleId: number) {
    grantLoading.value = true;
    try {
        const data = await systemApi.roleGrantTree(roleId);
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
        if (node.menuId) menuIds.add(node.menuId);
        if (node.permissionId) permissionIds.add(node.permissionId);
    });
    return {
        menuIds: Array.from(menuIds),
        permissionIds: Array.from(permissionIds),
    };
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

function dataScopeLabel(value?: string) {
    const labels: Record<string, string> = { ALL: t('system.role.dataAll'), SELF: t('system.role.dataSelf'), CUSTOM: t('system.role.dataCustom') };
    return value ? labels[value] || value : '-';
}

function nodeTypeName(value?: string) {
    const labels: Record<string, string> = { DIR: t('system.role.dir'), MENU: t('system.role.menu'), BTN: t('system.role.button') };
    return value ? labels[value] || value : '-';
}

function grantNodeLabel(node: RoleGrantNode) {
    return node.nodeType === 'BTN'
        ? node.name
        : resolveMerchantMenuLabel({ code: node.code, name: node.name }, t);
}

function tagType(value?: string) {
    if (value === 'MENU') return 'success';
    if (value === 'BTN') return 'warning';
    return 'primary';
}
</script>

<style scoped>
.role-auth-summary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
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
