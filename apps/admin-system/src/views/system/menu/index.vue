<template>
    <PageContainer title="菜单管理" category="系统管理" description="查询后台菜单、动态路由、组件路径和权限标识。">
        <template #extra>
            <el-tag type="success" effect="plain">接口已接入</el-tag>
        </template>

        <BaseSearch :model="query" :fields="searchFields" @search="loadData" @reset="handleReset" />

        <div class="toolbar">
            <div class="toolbar-left">
                <el-button type="primary" @click="loadData">刷新</el-button>
                <el-button disabled>新增</el-button>
                <el-button disabled>编辑</el-button>
                <el-button disabled>删除</el-button>
            </div>
            <span class="security-note">菜单写操作待动态路由、权限码和初始化 SQL 同步策略确认后开放。</span>
        </div>

        <div class="table-panel">
            <el-table
                v-loading="loading"
                :data="rows"
                border
                stripe
                default-expand-all
                row-key="menuId"
                :tree-props="{ children: 'children' }"
                class="base-table"
            >
                <template #empty>
                    <el-empty description="暂无数据" />
                </template>
                <el-table-column prop="menuName" label="菜单名称" min-width="190" show-overflow-tooltip />
                <el-table-column prop="menuTypeText" label="类型" width="100" />
                <el-table-column prop="routePath" label="路由路径" min-width="170" show-overflow-tooltip />
                <el-table-column prop="componentPath" label="组件路径" min-width="160" show-overflow-tooltip />
                <el-table-column prop="permissionCode" label="权限标识" min-width="180" show-overflow-tooltip />
                <el-table-column prop="visibleText" label="显示" width="90" />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <BaseStatusTag :value="row.status" />
                    </template>
                </el-table-column>
                <el-table-column prop="sortNo" label="排序" width="90" />
                <el-table-column label="操作" width="140" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openDetail(row)">查看</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="menu-summary">共 {{ total }} 个菜单节点</div>
        </div>

        <BaseDialog v-model="detailVisible" title="菜单详情" width="760px">
            <el-descriptions :column="2" border class="dialog-descriptions">
                <el-descriptions-item label="菜单ID">{{ activeRow?.menuId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="父级ID">{{ activeRow?.parentId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="菜单编码">{{ activeRow?.menuCode ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="菜单名称">{{ activeRow?.menuName ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="菜单类型">{{ activeRow?.menuTypeText ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="图标">{{ activeRow?.icon ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="路由路径">{{ activeRow?.routePath ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="组件路径">{{ activeRow?.componentPath ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="权限标识">{{ activeRow?.permissionCode ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="重定向">{{ activeRow?.redirect ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="显示">{{ activeRow?.visibleText ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="缓存">{{ activeRow?.keepAliveText ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="外链">{{ activeRow?.externalLinkText ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="排序">{{ activeRow?.sortNo ?? '-' }}</el-descriptions-item>
            </el-descriptions>
        </BaseDialog>
    </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { treeMenus, type SysMenu } from '@/api/system/menu';
import BaseDialog from '@/components/BaseDialog/index.vue';
import BaseSearch from '@/components/BaseSearch/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { CommonStatus } from '@/enums/status';
import type { CrudSearchField } from '@/types/admin';

interface SysMenuRow extends Omit<SysMenu, 'children' | 'status'> {
    status: CommonStatus;
    menuTypeText: string;
    visibleText: string;
    keepAliveText: string;
    externalLinkText: string;
    children?: SysMenuRow[];
}

const menuTypeOptions = [
    { label: '目录', value: 'CATALOG' },
    { label: '菜单', value: 'MENU' },
    { label: '按钮', value: 'BUTTON' },
    { label: '外链', value: 'LINK' },
];

const statusOptions = [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
];

const visibleOptions = [
    { label: '显示', value: 1 },
    { label: '隐藏', value: 0 },
];

const searchFields: CrudSearchField[] = [
    { prop: 'menuName', label: '菜单名称', placeholder: '请输入菜单名称' },
    { prop: 'menuType', label: '菜单类型', type: 'select', options: menuTypeOptions },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
    { prop: 'visible', label: '显示状态', type: 'select', options: visibleOptions },
];

const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const rows = ref<SysMenuRow[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const activeRow = ref<SysMenuRow | null>(null);

onMounted(() => {
    loadData();
});

async function loadData() {
    loading.value = true;
    try {
        const result = await treeMenus({
            menuName: textValue(query.menuName),
            menuType: textValue(query.menuType),
            status: numericValue(query.status),
            visible: numericValue(query.visible),
        });
        rows.value = result.map(normalizeRow);
        total.value = countNodes(rows.value);
    } catch (error) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error instanceof Error ? error.message : '菜单树加载失败');
    } finally {
        loading.value = false;
    }
}

function handleReset() {
    Object.keys(query).forEach((key) => {
        query[key] = '';
    });
    loadData();
}

function openDetail(row: SysMenuRow) {
    activeRow.value = row;
    detailVisible.value = true;
}

function textValue(value: unknown) {
    return String(value || '').trim() || undefined;
}

function numericValue(value: unknown) {
    return typeof value === 'number' ? value : undefined;
}

function normalizeRow(menu: SysMenu): SysMenuRow {
    return {
        ...menu,
        status: menu.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled,
        menuTypeText: typeLabel(menu.menuType),
        visibleText: yesNo(menu.visible),
        keepAliveText: yesNo(menu.keepAlive),
        externalLinkText: yesNo(menu.externalLink),
        children: menu.children?.map(normalizeRow),
    };
}

function typeLabel(type: string) {
    const labels: Record<string, string> = {
        CATALOG: '目录',
        MENU: '菜单',
        BUTTON: '按钮',
        LINK: '外链',
    };
    return labels[type] || type || '-';
}

function yesNo(value: number | undefined) {
    return value === 1 ? '是' : '否';
}

function countNodes(menus: SysMenuRow[]): number {
    return menus.reduce((count, menu) => count + 1 + countNodes(menu.children || []), 0);
}
</script>

<style scoped>
.menu-summary {
    display: flex;
    justify-content: flex-end;
    padding: 12px 16px;
    color: var(--app-muted);
    font-size: 13px;
}
</style>
