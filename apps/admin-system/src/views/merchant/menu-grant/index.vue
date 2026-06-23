<template>
    <div class="app-container merchant-menu-grant-page">
        <div class="merchant-grant-layout">
            <section class="merchant-panel">
                <div class="panel-header">
                    <span>选择商户</span>
                    <el-button size="small" :icon="Refresh" @click="loadMerchants">刷新</el-button>
                </div>
                <el-form :model="query" :inline="true" size="small" class="merchant-search">
                    <el-form-item>
                        <el-input v-model="query.keyword" placeholder="商户号/名称" clearable @keyup.enter="loadMerchants" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" :icon="Search" @click="loadMerchants">搜索</el-button>
                    </el-form-item>
                </el-form>
                <el-table
                    v-loading="merchantLoading"
                    :data="merchants"
                    row-key="merchantId"
                    size="small"
                    highlight-current-row
                    @current-change="selectMerchant"
                >
                    <el-table-column prop="merchantId" label="商户号" min-width="120" />
                    <el-table-column prop="merchantName" label="商户名称" min-width="180" show-overflow-tooltip />
                </el-table>
            </section>

            <section class="grant-panel">
                <div class="panel-header">
                    <div>
                        <span>{{ activeMerchant ? `授权配置：${activeMerchant.merchantId}` : '授权配置' }}</span>
                        <small v-if="activeMerchant">{{ activeMerchant.merchantName }}</small>
                    </div>
                    <div class="header-actions">
                        <el-checkbox v-model="parentChildLinked" :disabled="!activeMerchant">父子联动</el-checkbox>
                        <el-button :disabled="!activeMerchant" @click="selectAll">全选</el-button>
                        <el-button :disabled="!activeMerchant" @click="clearAll">清空</el-button>
                        <el-button type="primary" :icon="Check" :disabled="!activeMerchant" @click="save">保存授权</el-button>
                    </div>
                </div>

                <el-empty v-if="!activeMerchant" description="请先选择商户" />
                <div v-else class="grant-content">
                    <div class="grant-tree-header">
                        <div>
                            <strong>菜单与功能权限</strong>
                            <span>目录、菜单、按钮和接口权限统一授权</span>
                        </div>
                        <small>菜单 {{ selectedDisplayMenuIds.length }} / {{ displayMenuIds.length }}，权限 {{ checkedPermissionIds.length }} / {{ grantablePermissions.length }}</small>
                    </div>
                    <el-tree
                        ref="grantTreeRef"
                        class="grant-tree"
                        :data="grantTree"
                        node-key="id"
                        show-checkbox
                        default-expand-all
                        check-on-click-node
                        :check-strictly="!parentChildLinked"
                        :props="{ label: 'label', children: 'children' }"
                        @check="handleGrantTreeCheck"
                    >
                        <template #default="{ data }">
                            <span class="tree-node">
                                <el-tag size="small" :type="nodeTagType(data)">
                                    {{ nodeTypeName(data) }}
                                </el-tag>
                                <span class="tree-node__label">{{ data.label }}</span>
                                <code v-if="data.permissionCode">{{ data.permissionCode }}</code>
                                <span v-if="data.resourceMethod && data.resourcePath" class="tree-node__resource">
                                    {{ data.resourceMethod }} {{ data.resourcePath }}
                                </span>
                            </span>
                        </template>
                    </el-tree>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, type ElTree } from 'element-plus';
import { Check, Refresh, Search } from '@element-plus/icons-vue';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import {
    queryMerchantMenuGrant,
    saveMerchantMenuGrant,
    type MerchantGrantMenu,
    type MerchantGrantPermission,
} from '@/api/merchant/menu-grant';

type GrantNodeKind = 'CATALOG' | 'MENU' | 'PERMISSION_GROUP' | 'PERMISSION';

interface GrantTreeNode {
    id: string;
    kind: GrantNodeKind;
    label: string;
    menuId?: number;
    permissionId?: number;
    permissionType?: string;
    permissionCode?: string;
    resourceMethod?: string;
    resourcePath?: string;
    children: GrantTreeNode[];
}

const merchantLoading = ref(false);
const activeMerchant = ref<MerchantInfo>();
const merchants = ref<MerchantInfo[]>([]);
const query = reactive({ keyword: '', pageNo: 1, pageSize: 20 });
const menuTree = ref<MerchantGrantMenu[]>([]);
const permissions = ref<MerchantGrantPermission[]>([]);
const checkedPermissionIds = ref<number[]>([]);
const selectedMenuIds = ref<number[]>([]);
const parentChildLinked = ref(true);
const grantTreeRef = ref<InstanceType<typeof ElTree>>();

const flatMenus = computed(() => flattenMenus(menuTree.value));
const allMenuIds = computed(() => flatMenus.value.map((menu) => menu.menuId));
const displayMenuIds = computed(() => flatMenus.value.filter(isDisplayMenu).map((menu) => menu.menuId));
const displayMenuIdSet = computed(() => new Set(displayMenuIds.value));
const selectedDisplayMenuIds = computed(() => selectedMenuIds.value.filter((menuId) => displayMenuIdSet.value.has(menuId)));
const menuById = computed(() => new Map(flatMenus.value.map((menu) => [menu.menuId, menu])));
const permissionById = computed(() => new Map(permissions.value.map((permission) => [permission.permissionId, permission])));
const parentMenuIdMap = computed(() => new Map(flatMenus.value.map((menu) => [menu.menuId, menu.parentId])));
const grantTree = computed(() => buildGrantTree(menuTree.value, permissions.value));
const grantablePermissions = computed(() => permissions.value.filter((permission) => isGrantablePermission(permission) && permissionDisplayMenuId(permission)));
const allTreeCheckedKeys = computed(() => [
    ...displayMenuIds.value.map(menuKey),
    ...grantablePermissions.value.map((permission) => permissionKey(permission.permissionId)),
]);

async function loadMerchants() {
    merchantLoading.value = true;
    try {
        const page = await searchMerchants(query);
        merchants.value = page.records;
    } finally {
        merchantLoading.value = false;
    }
}

async function selectMerchant(row?: MerchantInfo) {
    activeMerchant.value = row;
    if (!row) {
        resetGrantData();
        return;
    }
    const grant = await queryMerchantMenuGrant(row.merchantId);
    menuTree.value = grant.menus;
    permissions.value = grant.permissions;
    checkedPermissionIds.value = [...grant.checkedPermissionIds];
    selectedMenuIds.value = [...grant.checkedMenuIds];
    await nextTick();
    grantTreeRef.value?.setCheckedKeys(toTreeCheckedKeys(grant.checkedMenuIds, grant.checkedPermissionIds), false);
    syncSelectionFromTree();
}

function handleGrantTreeCheck() {
    syncSelectionFromTree();
}

function selectAll() {
    grantTreeRef.value?.setCheckedKeys(allTreeCheckedKeys.value, false);
    syncSelectionFromTree();
}

function clearAll() {
    grantTreeRef.value?.setCheckedKeys([], false);
    syncSelectionFromTree();
}

async function save() {
    if (!activeMerchant.value) return;
    const selection = readTreeSelection();
    await saveMerchantMenuGrant(activeMerchant.value.merchantId, selection.menuIds, selection.permissionIds);
    ElMessage.success('保存成功');
    await selectMerchant(activeMerchant.value);
}

function resetGrantData() {
    menuTree.value = [];
    permissions.value = [];
    checkedPermissionIds.value = [];
    selectedMenuIds.value = [];
    grantTreeRef.value?.setCheckedKeys([], false);
}

function syncSelectionFromTree() {
    const selection = readTreeSelection();
    selectedMenuIds.value = selection.menuIds;
    checkedPermissionIds.value = selection.permissionIds;
}

function readTreeSelection() {
    const checkedKeys = grantTreeRef.value?.getCheckedKeys(false).map(String) || [];
    const halfCheckedKeys = grantTreeRef.value?.getHalfCheckedKeys().map(String) || [];
    const menuIds = new Set<number>();
    const permissionIds = new Set<number>();
    [...checkedKeys, ...halfCheckedKeys].forEach((key) => {
        if (key.startsWith('m-')) {
            addMenuWithAncestors(Number(key.slice(2)), menuIds);
        }
    });
    checkedKeys.forEach((key) => {
        if (!key.startsWith('p-')) {
            return;
        }
        const permissionId = Number(key.slice(2));
        const permission = permissionById.value.get(permissionId);
        if (permission?.menuId) {
            addMenuWithAncestors(permission.menuId, menuIds);
        }
        permissionIds.add(permissionId);
    });
    permissions.value
        .filter((permission) => permission.permissionType === 'MENU' && permission.menuId && menuIds.has(permission.menuId))
        .forEach((permission) => permissionIds.add(permission.permissionId));
    const normalizedMenuIds = Array.from(menuIds).filter((menuId) => menuById.value.has(menuId));
    const normalizedPermissionIds = Array.from(permissionIds).filter((permissionId) => {
        const permission = permissionById.value.get(permissionId);
        return permission && (!permission.menuId || menuIds.has(permission.menuId));
    });
    return {
        menuIds: normalizedMenuIds,
        permissionIds: normalizedPermissionIds,
    };
}

function buildGrantTree(menus: MerchantGrantMenu[], permissionRows: MerchantGrantPermission[]) {
    const permissionsByMenu = new Map<number, MerchantGrantPermission[]>();
    const unassignedPermissions: MerchantGrantPermission[] = [];
    permissionRows.forEach((permission) => {
        if (permission.permissionType === 'MENU') {
            return;
        }
        const displayMenuId = permissionDisplayMenuId(permission);
        if (!displayMenuId && !permission.menuId) {
            unassignedPermissions.push(permission);
            return;
        }
        if (!displayMenuId) {
            return;
        }
        const rows = permissionsByMenu.get(displayMenuId) || [];
        rows.push(permission);
        permissionsByMenu.set(displayMenuId, rows);
    });
    const visit = (items: MerchantGrantMenu[]): GrantTreeNode[] => items.flatMap((menu) => {
        if (!isDisplayMenu(menu)) {
            return [];
        }
        return [{
            id: menuKey(menu.menuId),
            kind: menu.menuType === 'CATALOG' ? 'CATALOG' : 'MENU',
            label: menu.menuName,
            menuId: menu.menuId,
            permissionCode: menu.permissionCode || findMenuPermissionCode(menu.menuId),
            children: [
                ...visit(menu.children || []),
                ...(permissionsByMenu.get(menu.menuId) || []).map(toPermissionNode),
            ],
        }];
    });
    const roots = visit(menus);
    if (unassignedPermissions.length) {
        roots.push({
            id: 'permission-unassigned',
            kind: 'PERMISSION_GROUP',
            label: '未归属权限',
            children: unassignedPermissions.map(toPermissionNode),
        });
    }
    return roots;
}

function toPermissionNode(permission: MerchantGrantPermission): GrantTreeNode {
    return {
        id: permissionKey(permission.permissionId),
        kind: 'PERMISSION',
        label: permission.permissionName,
        menuId: permission.menuId,
        permissionId: permission.permissionId,
        permissionType: permission.permissionType,
        permissionCode: permission.permissionCode,
        resourceMethod: permission.resourceMethod,
        resourcePath: permission.resourcePath,
        children: [],
    };
}

function findMenuPermissionCode(menuId: number) {
    return permissions.value.find((permission) => permission.menuId === menuId && permission.permissionType === 'MENU')?.permissionCode;
}

function toTreeCheckedKeys(menuIds: number[], permissionIds: number[]) {
    const nonMenuPermissionKeys = permissionIds
        .map((permissionId) => permissionById.value.get(permissionId))
        .filter(isGrantablePermission)
        .map((permission) => permissionKey(permission.permissionId));
    return [...menuIds.map(menuKey), ...nonMenuPermissionKeys];
}

function isGrantablePermission(permission?: MerchantGrantPermission): permission is MerchantGrantPermission {
    return Boolean(permission) && permission?.permissionType !== 'MENU';
}

function isDisplayMenu(menu?: MerchantGrantMenu) {
    return Boolean(menu) && menu?.menuType !== 'BUTTON' && menu?.visible !== 0;
}

function permissionDisplayMenuId(permission: MerchantGrantPermission) {
    if (!permission.menuId) {
        return undefined;
    }
    const menu = menuById.value.get(permission.menuId);
    if (!menu) {
        return undefined;
    }
    if (isDisplayMenu(menu)) {
        return menu.menuId;
    }
    if (menu.menuType !== 'BUTTON') {
        return undefined;
    }
    return nearestDisplayParentMenuId(menu);
}

function nearestDisplayParentMenuId(menu: MerchantGrantMenu) {
    let parentId = menu.parentId;
    while (parentId && parentId > 0) {
        const parent = menuById.value.get(parentId);
        if (!parent) {
            return undefined;
        }
        if (parent.menuType !== 'BUTTON' && !isDisplayMenu(parent)) {
            return undefined;
        }
        if (isDisplayMenu(parent)) {
            return parent.menuId;
        }
        parentId = parent.parentId;
    }
    return undefined;
}

function addMenuWithAncestors(menuId: number, collector: Set<number>) {
    if (!menuId || collector.has(menuId)) {
        return;
    }
    collector.add(menuId);
    const parentId = parentMenuIdMap.value.get(menuId);
    if (parentId && parentId > 0) {
        addMenuWithAncestors(parentId, collector);
    }
}

function flattenMenus(nodes: MerchantGrantMenu[]): MerchantGrantMenu[] {
    const result: MerchantGrantMenu[] = [];
    const visit = (items: MerchantGrantMenu[]) => {
        items.forEach((item) => {
            result.push(item);
            visit(item.children || []);
        });
    };
    visit(nodes);
    return result;
}

function menuKey(menuId: number) {
    return `m-${menuId}`;
}

function permissionKey(permissionId: number) {
    return `p-${permissionId}`;
}

function nodeTypeName(node: GrantTreeNode) {
    if (node.kind === 'CATALOG') {
        return '目录';
    }
    if (node.kind === 'MENU') {
        return '菜单';
    }
    if (node.kind === 'PERMISSION_GROUP') {
        return '分组';
    }
    const names: Record<string, string> = {
        BUTTON: '按钮',
        API: '接口',
        DATA: '数据',
    };
    return names[node.permissionType || ''] || '权限';
}

function nodeTagType(node: GrantTreeNode) {
    if (node.kind === 'CATALOG') {
        return 'info';
    }
    if (node.kind === 'MENU') {
        return 'success';
    }
    if (node.permissionType === 'BUTTON') {
        return 'warning';
    }
    if (node.permissionType === 'API') {
        return 'primary';
    }
    return 'info';
}

onMounted(loadMerchants);
</script>

<style scoped>
.merchant-grant-layout {
    display: grid;
    grid-template-columns: 420px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
}

.merchant-panel,
.grant-panel {
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    background: var(--el-bg-color);
}

.panel-header {
    min-height: 48px;
    padding: 0 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-weight: 600;
}

.panel-header small {
    display: block;
    margin-top: 2px;
    color: var(--el-text-color-secondary);
    font-weight: 400;
}

.merchant-search {
    padding: 12px 16px 0;
}

.merchant-panel :deep(.el-table) {
    padding: 0 12px 12px;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.grant-content {
    padding: 16px;
}

.grant-tree-header {
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
}

.grant-tree-header strong {
    display: block;
    font-size: 14px;
}

.grant-tree-header span,
.grant-tree-header small {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.grant-tree {
    height: calc(100vh - 220px);
    min-height: 760px;
    overflow: auto;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 8px;
}

.tree-node {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.tree-node__label {
    color: var(--el-text-color-primary);
}

.tree-node code {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.tree-node__resource {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
}
</style>
