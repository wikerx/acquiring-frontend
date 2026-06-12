<template>
    <PageContainer title="菜单管理" category="系统管理" description="查询后台菜单、动态路由、组件路径和权限标识。">
        <template #extra>
            <el-tag type="success" effect="plain">接口已接入</el-tag>
        </template>

        <BaseSearch :model="query" :fields="searchFields" @search="loadData" @reset="handleReset" />

        <div class="toolbar">
            <div class="toolbar-left">
                <el-button type="primary" @click="openCreate">新增</el-button>
                <el-button @click="loadData">刷新</el-button>
            </div>
            <span class="security-note">菜单编码创建后暂不支持改名；删除能力暂不开放。</span>
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
                <el-table-column label="操作" width="210" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openDetail(row)">查看</el-button>
                        <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                        <el-button
                            link
                            :type="row.statusValue === 1 ? 'danger' : 'success'"
                            @click="toggleStatus(row)"
                        >
                            {{ row.statusValue === 1 ? '停用' : '启用' }}
                        </el-button>
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

        <BaseDialog
            v-model="menuDialogVisible"
            :title="formMode === 'create' ? '新增菜单' : '编辑菜单'"
            width="760px"
            @confirm="submitMenuForm"
        >
            <el-form ref="menuFormRef" :model="menuForm" :rules="menuFormRules" label-width="110px">
                <el-form-item label="父级菜单" prop="parentId">
                    <el-select v-model="menuForm.parentId" filterable>
                        <el-option :value="0" label="根目录" />
                        <el-option
                            v-for="item in parentOptions"
                            :key="item.menuId"
                            :value="item.menuId"
                            :label="item.label"
                            :disabled="formMode === 'edit' && item.menuId === menuForm.menuId"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="菜单编码" prop="menuCode">
                    <el-input v-model="menuForm.menuCode" :disabled="formMode === 'edit'" maxlength="100" />
                </el-form-item>
                <el-form-item label="菜单名称" prop="menuName">
                    <el-input v-model="menuForm.menuName" maxlength="100" />
                </el-form-item>
                <el-form-item label="菜单类型" prop="menuType">
                    <el-select v-model="menuForm.menuType">
                        <el-option v-for="item in menuTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="路由路径" prop="routePath">
                    <el-input v-model="menuForm.routePath" maxlength="255" />
                </el-form-item>
                <el-form-item label="组件路径" prop="componentPath">
                    <el-input v-model="menuForm.componentPath" maxlength="255" />
                </el-form-item>
                <el-form-item label="权限标识" prop="permissionCode">
                    <el-input v-model="menuForm.permissionCode" maxlength="150" />
                </el-form-item>
                <el-form-item label="图标" prop="icon">
                    <el-input v-model="menuForm.icon" maxlength="80" />
                </el-form-item>
                <el-form-item label="重定向" prop="redirect">
                    <el-input v-model="menuForm.redirect" maxlength="255" />
                </el-form-item>
                <el-form-item label="排序" prop="sortNo">
                    <el-input-number v-model="menuForm.sortNo" :min="0" :max="9999" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="menuForm.status">
                        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="显示">
                    <el-switch v-model="menuForm.visible" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="缓存">
                    <el-switch v-model="menuForm.keepAlive" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="外链">
                    <el-switch v-model="menuForm.externalLink" :active-value="1" :inactive-value="0" />
                </el-form-item>
            </el-form>
        </BaseDialog>
    </PageContainer>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
    createMenu,
    treeMenus,
    updateMenu,
    updateMenuStatus,
    type SysMenu,
} from '@/api/system/menu';
import BaseDialog from '@/components/BaseDialog/index.vue';
import BaseSearch from '@/components/BaseSearch/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { CommonStatus } from '@/enums/status';
import type { CrudSearchField } from '@/types/admin';

interface SysMenuRow extends Omit<SysMenu, 'children' | 'status'> {
    status: CommonStatus;
    statusValue: number;
    menuTypeText: string;
    visibleText: string;
    keepAliveText: string;
    externalLinkText: string;
    children?: SysMenuRow[];
}

interface ParentOption {
    menuId: number;
    label: string;
}

interface MenuForm {
    menuId?: number;
    parentId: number;
    menuCode: string;
    menuName: string;
    menuType: string;
    routePath: string;
    componentPath: string;
    permissionCode: string;
    icon: string;
    redirect: string;
    visible: number;
    keepAlive: number;
    externalLink: number;
    sortNo: number;
    status: number;
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
const menuDialogVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeRow = ref<SysMenuRow | null>(null);
const menuFormRef = ref<FormInstance>();

const menuForm = reactive<MenuForm>({
    parentId: 0,
    menuCode: '',
    menuName: '',
    menuType: 'MENU',
    routePath: '',
    componentPath: '',
    permissionCode: '',
    icon: '',
    redirect: '',
    visible: 1,
    keepAlive: 0,
    externalLink: 0,
    sortNo: 100,
    status: 1,
});

const menuFormRules: FormRules = {
    parentId: [{ required: true, message: '请选择父级菜单', trigger: 'change' }],
    menuCode: [{ required: true, message: '请输入菜单编码', trigger: 'blur' }],
    menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
};

const parentOptions = computed<ParentOption[]>(() => {
    const options: ParentOption[] = [];
    flattenMenus(rows.value, options);
    return options;
});

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

function openCreate() {
    formMode.value = 'create';
    activeRow.value = null;
    Object.assign(menuForm, {
        menuId: undefined,
        parentId: 0,
        menuCode: '',
        menuName: '',
        menuType: 'MENU',
        routePath: '',
        componentPath: '',
        permissionCode: '',
        icon: '',
        redirect: '',
        visible: 1,
        keepAlive: 0,
        externalLink: 0,
        sortNo: 100,
        status: 1,
    });
    menuDialogVisible.value = true;
    nextTick(() => menuFormRef.value?.clearValidate());
}

function openEdit(row: SysMenuRow) {
    formMode.value = 'edit';
    activeRow.value = row;
    Object.assign(menuForm, {
        menuId: row.menuId,
        parentId: row.parentId,
        menuCode: row.menuCode,
        menuName: row.menuName,
        menuType: row.menuType,
        routePath: row.routePath || '',
        componentPath: row.componentPath || '',
        permissionCode: row.permissionCode || '',
        icon: row.icon || '',
        redirect: row.redirect || '',
        visible: row.visible ?? 1,
        keepAlive: row.keepAlive ?? 0,
        externalLink: row.externalLink ?? 0,
        sortNo: row.sortNo ?? 100,
        status: row.statusValue,
    });
    menuDialogVisible.value = true;
    nextTick(() => menuFormRef.value?.clearValidate());
}

async function submitMenuForm() {
    const valid = await menuFormRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    try {
        const payload = {
            parentId: menuForm.parentId,
            menuName: menuForm.menuName.trim(),
            menuType: menuForm.menuType,
            routePath: trimOptional(menuForm.routePath),
            componentPath: trimOptional(menuForm.componentPath),
            permissionCode: trimOptional(menuForm.permissionCode),
            icon: trimOptional(menuForm.icon),
            redirect: trimOptional(menuForm.redirect),
            visible: menuForm.visible,
            keepAlive: menuForm.keepAlive,
            externalLink: menuForm.externalLink,
            sortNo: menuForm.sortNo,
            status: menuForm.status,
        };
        if (formMode.value === 'create') {
            await createMenu({
                ...payload,
                menuCode: menuForm.menuCode.trim(),
            });
            ElMessage.success('菜单已新增');
        } else if (menuForm.menuId) {
            await updateMenu({
                ...payload,
                menuId: menuForm.menuId,
            });
            ElMessage.success('菜单已更新');
        }
        menuDialogVisible.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '菜单保存失败');
    }
}

async function toggleStatus(row: SysMenuRow) {
    const nextStatus = row.statusValue === 1 ? 0 : 1;
    const actionText = nextStatus === 1 ? '启用' : '停用';
    try {
        await ElMessageBox.confirm(`确定${actionText}菜单 ${row.menuName}？`, `${actionText}菜单`, {
            type: nextStatus === 1 ? 'success' : 'warning',
        });
        await updateMenuStatus({ menuId: row.menuId, status: nextStatus });
        ElMessage.success(`菜单已${actionText}`);
        loadData();
    } catch (error) {
        if (error instanceof Error) {
            ElMessage.error(error.message);
        }
    }
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
        statusValue: menu.status ?? 0,
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

function flattenMenus(menus: SysMenuRow[], options: ParentOption[], level = 0) {
    menus.forEach((menu) => {
        options.push({
            menuId: menu.menuId,
            label: `${'  '.repeat(level)}${menu.menuName}`,
        });
        flattenMenus(menu.children || [], options, level + 1);
    });
}

function trimOptional(value: string) {
    return value.trim() || undefined;
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
