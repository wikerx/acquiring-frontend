<template>
    <div class="page system-page">
        <el-form :model="query" inline size="small" class="search-form">
            <el-form-item label="岗位名称"><el-input v-model="query.keyword" placeholder="岗位名称/编码" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item label="状态"><el-select v-model="query.status" placeholder="全部" clearable><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" @click="applyQuery">查询</el-button><el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button></el-form-item>
        </el-form>
        <div class="toolbar"><el-button v-if="canAdd" type="primary" plain size="small" :icon="Plus" @click="openForm()">新增岗位</el-button><el-button plain size="small" :icon="Refresh" @click="loadData">刷新</el-button></div>
        <el-table v-loading="loading" :data="rows" row-key="postId" size="small">
            <el-table-column prop="postCode" label="岗位编码" min-width="160" />
            <el-table-column prop="postName" label="岗位名称" min-width="180" />
            <el-table-column prop="sortNo" label="排序" width="90" align="center" />
            <el-table-column label="状态" width="100" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
                <template #default="{ row }">
                    <el-button v-if="canEdit" size="small" link type="primary" :icon="Edit" @click="openForm(row)">编辑</el-button>
                    <el-button v-if="canDelete" size="small" link type="danger" :icon="Delete" @click="remove(row)">删除</el-button>
                    <span v-if="!canEdit && !canDelete">-</span>
                </template>
            </el-table-column>
        </el-table>
        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>
        <el-dialog v-model="visible" :title="form.postId ? '编辑岗位' : '新增岗位'" width="480px">
            <el-form :model="form" label-width="88px">
                <el-form-item label="岗位编码"><el-input v-model="form.postCode" /></el-form-item>
                <el-form-item label="岗位名称"><el-input v-model="form.postName" /></el-form-item>
                <el-form-item label="排序"><el-input-number v-model="form.sortNo" :min="0" /></el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
            </el-form>
            <template #footer><el-button size="small" @click="visible = false">取消</el-button><el-button type="primary" size="small" @click="submit">保存</el-button></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit, Plus, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue';
import { systemApi, type PostItem } from '@/api/systemApi';
import { hasPermission } from '@/utils/permission';

const loading = ref(false);
const visible = ref(false);
const rows = ref<PostItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const query = reactive<{ keyword: string; status?: number }>({ keyword: '' });
const form = reactive<Partial<PostItem>>({ status: 1, sortNo: 0 });
const canAdd = hasPermission('merchant:system:post:add');
const canEdit = hasPermission('merchant:system:post:edit');
const canDelete = hasPermission('merchant:system:post:delete');

async function loadData() {
    loading.value = true;
    try {
        const result = await systemApi.pagePosts({
            pageNo: page.value,
            pageSize: pageSize.value,
            keyword: query.keyword.trim() || undefined,
            status: query.status,
        });
        rows.value = result.records;
        total.value = result.total;
    } finally { loading.value = false; }
}
function applyQuery() {
    page.value = 1;
    loadData();
}
function resetQuery() { query.keyword = ''; query.status = undefined; applyQuery(); }
function openForm(row?: PostItem) {
    Object.assign(form, row || { postId: undefined, postCode: '', postName: '', sortNo: 0, status: 1, remark: '' });
    visible.value = true;
}
async function submit() {
    await systemApi.savePost(form, form.postId);
    ElMessage.success('保存成功');
    visible.value = false;
    await loadData();
}
async function remove(row: PostItem) {
    await ElMessageBox.confirm(`确认删除岗位 ${row.postName}？`, '删除确认', { type: 'warning' });
    await systemApi.deletePost(row.postId);
    ElMessage.success('删除成功');
    await loadData();
}
onMounted(loadData);
</script>
