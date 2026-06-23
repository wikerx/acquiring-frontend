<template>
    <div class="page system-page">
        <el-form :model="query" inline size="small" class="search-form">
            <el-form-item label="部门名称"><el-input v-model="query.keyword" placeholder="部门名称/编码" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item label="状态"><el-select v-model="query.status" placeholder="全部" clearable><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" @click="applyQuery">查询</el-button><el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button></el-form-item>
        </el-form>
        <div class="toolbar">
            <el-button v-if="canAdd" type="primary" plain size="small" :icon="Plus" @click="openForm()">新增部门</el-button>
            <el-button plain size="small" :icon="Refresh" @click="loadData">刷新</el-button>
        </div>
        <el-table v-loading="loading" :data="filteredRows" row-key="deptId" size="small">
            <el-table-column prop="deptName" label="部门名称" min-width="180" />
            <el-table-column prop="deptCode" label="部门编码" min-width="160" />
            <el-table-column prop="sortNo" label="排序" width="90" align="center" />
            <el-table-column label="状态" width="100" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="180" align="center">
                <template #default="{ row }">
                    <el-button v-if="canEdit" link type="primary" @click="openForm(row)">编辑</el-button>
                    <el-button v-if="canDelete" link type="danger" @click="remove(row)">删除</el-button>
                    <span v-if="!canEdit && !canDelete">-</span>
                </template>
            </el-table-column>
        </el-table>
        <el-dialog v-model="visible" :title="form.deptId ? '编辑部门' : '新增部门'" width="520px">
            <el-form :model="form" label-width="92px">
                <el-form-item label="上级部门"><el-tree-select v-model="form.parentId" :data="treeOptions" node-key="deptId" :props="{ label: 'deptName', value: 'deptId', children: 'children' }" check-strictly clearable /></el-form-item>
                <el-form-item label="部门编码"><el-input v-model="form.deptCode" /></el-form-item>
                <el-form-item label="部门名称"><el-input v-model="form.deptName" /></el-form-item>
                <el-form-item label="排序"><el-input-number v-model="form.sortNo" :min="0" /></el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
            </el-form>
            <template #footer><el-button size="small" @click="visible = false">取消</el-button><el-button type="primary" size="small" @click="submit">保存</el-button></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue';
import { systemApi, type DeptItem } from '@/api/systemApi';
import { hasPermission } from '@/utils/permission';

const loading = ref(false);
const visible = ref(false);
const rows = ref<DeptItem[]>([]);
const treeOptions = ref<DeptItem[]>([]);
const query = reactive<{ keyword: string; status?: number }>({ keyword: '' });
const form = reactive<Partial<DeptItem>>({ parentId: 0, status: 1, sortNo: 0 });
const canAdd = hasPermission('merchant:system:dept:add');
const canEdit = hasPermission('merchant:system:dept:edit');
const canDelete = hasPermission('merchant:system:dept:delete');
const filteredRows = computed(() => filterDeptTree(rows.value));

async function loadData() {
    loading.value = true;
    try {
        rows.value = await systemApi.deptTree();
        treeOptions.value = [{ deptId: 0, parentId: 0, deptCode: 'ROOT', deptName: '顶级部门', sortNo: 0, status: 1, children: rows.value }];
    } finally {
        loading.value = false;
    }
}

function applyQuery() {
    // computed rows update from query state
}

function resetQuery() {
    query.keyword = '';
    query.status = undefined;
}

function filterDeptTree(items: DeptItem[]): DeptItem[] {
    const keyword = query.keyword.trim().toLowerCase();
    const result: DeptItem[] = [];
    items.forEach((item) => {
        const children = filterDeptTree(item.children || []);
        const matchedKeyword = !keyword
            || item.deptName.toLowerCase().includes(keyword)
            || item.deptCode.toLowerCase().includes(keyword);
        const matchedStatus = query.status === undefined || item.status === query.status;
        if ((matchedKeyword && matchedStatus) || children.length) {
            result.push({ ...item, children });
        }
    });
    return result;
}

function openForm(row?: DeptItem) {
    Object.assign(form, row || { deptId: undefined, parentId: 0, deptCode: '', deptName: '', sortNo: 0, status: 1, remark: '' });
    visible.value = true;
}

async function submit() {
    await systemApi.saveDept(form, form.deptId);
    ElMessage.success('保存成功');
    visible.value = false;
    await loadData();
}

async function remove(row: DeptItem) {
    await ElMessageBox.confirm(`确认删除部门 ${row.deptName}？`, '删除确认', { type: 'warning' });
    await systemApi.deleteDept(row.deptId);
    ElMessage.success('删除成功');
    await loadData();
}

onMounted(loadData);
</script>
