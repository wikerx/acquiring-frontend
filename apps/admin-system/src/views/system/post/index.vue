<template>
    <div class="app-container">
        <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="$t('system.post.postCode')" prop="postCode"><el-input v-model="query.postCode" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item :label="$t('system.post.postName')" prop="postName"><el-input v-model="query.postName" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleQuery">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button></el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'system:post:add'">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="!selectedRows.length || selectedRows.length !== 1" @click="handleUpdate(selectedRows[0])" v-hasPermi="'system:post:edit'">{{ $t('common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete()" v-hasPermi="'system:post:remove'">{{ $t('common.delete') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'system:post:export'">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleQuery" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="postCode" :label="$t('system.post.postCode')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="postName" :label="$t('system.post.postName')" min-width="140" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="sortNo" :label="$t('common.sort')" width="70" align="center" />
            <el-table-column :label="$t('common.status')" width="80" align="center"><template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'system:post:edit'" /></template></el-table-column>
            <el-table-column :label="$t('common.createTime')" min-width="160" align="center"><template #default="{ row }"><BaseDateTime :value="row.createdAt" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="200" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:post:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'system:post:remove'">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

        <el-dialog :title="dialogTitle" v-model="open" width="560px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding:0 20px">
                <el-form-item :label="$t('system.post.postCode')" prop="postCode"><el-input v-model="form.postCode" :disabled="formMode === 'edit'" maxlength="80" placeholder="POST_XXX" /></el-form-item>
                <el-form-item :label="$t('system.post.postName')" prop="postName"><el-input v-model="form.postName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('common.sort')" prop="sortNo"><el-input-number v-model="form.sortNo" :min="0" :max="9999" controls-position="right" /></el-form-item>
                <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="form.status" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="$t('common.remark')" prop="remark"><el-input v-model="form.remark" type="textarea" maxlength="200" :placeholder="$t('common.pleaseInput')" /></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submit">{{ $t('common.confirm') }}</el-button><el-button @click="open = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchPosts, createPost, updatePost, deletePost, exportPosts, type SysPost } from '@/api/system/post';

const { t } = useI18n();
interface PostRow extends SysPost { }
const showSearch = ref(true); const query = reactive<Record<string, unknown>>({}); const queryFormRef = ref<FormInstance>();
const loading = ref(false); const rows = ref<PostRow[]>([]); const total = ref(0); const page = ref(1); const pageSize = ref(10);
const selectedRows = ref<PostRow[]>([]); const open = ref(false);
const formMode = ref<'create' | 'edit'>('create'); const activeRow = ref<PostRow | null>(null); const formRef = ref<FormInstance>();
const dialogTitle = computed(() => formMode.value === 'create' ? t('common.add') : t('common.edit'));
const form = reactive<SysPost>({ postCode: '', postName: '', sortNo: 100, status: 1, remark: '' });
const rules: FormRules = { postCode: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }], postName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }] };

watch([page, pageSize], () => loadData());
onMounted(() => loadData());

async function loadData() { loading.value = true; try { const r = await searchPosts({ pageNo: page.value, pageSize: pageSize.value, postCode: sv(query.postCode), postName: sv(query.postName), status: nv(query.status) }); rows.value = r.records; total.value = r.total; } catch { rows.value = []; total.value = 0; } finally { loading.value = false; } }
function handleQuery() { page.value === 1 ? loadData() : (page.value = 1); }
function resetQuery() { Object.keys(query).forEach(k => query[k] = ''); handleQuery(); }
function handleSelectionChange(s: PostRow[]) { selectedRows.value = s; }
function handleAdd() { formMode.value = 'create'; Object.assign(form, { id: undefined, postCode: '', postName: '', sortNo: 100, status: 1, remark: '' }); open.value = true; nextTick(() => formRef.value?.clearValidate()); }
function handleUpdate(row: PostRow) { formMode.value = 'edit'; activeRow.value = row; Object.assign(form, { id: row.id, postCode: row.postCode, postName: row.postName, sortNo: row.sortNo, status: row.status, remark: row.remark || '' }); open.value = true; nextTick(() => formRef.value?.clearValidate()); }
async function submit() { const v = await formRef.value?.validate().catch(() => false); if (!v) return; try { if (formMode.value === 'create') { await createPost({ postCode: form.postCode.trim(), postName: form.postName.trim(), sortNo: form.sortNo, status: form.status, remark: form.remark?.trim() }); ElMessage.success(t('common.addSuccess')); } else if (form.id) { await updatePost(form.id, { postCode: form.postCode.trim(), postName: form.postName.trim(), sortNo: form.sortNo, status: form.status, remark: form.remark?.trim() }); ElMessage.success(t('common.editSuccess')); } open.value = false; loadData(); } catch (e) { ElMessage.error(e instanceof Error ? e.message : t('common.saveFailed')); } }
async function toggleStatus(row: PostRow) { const ns = row.status === 1 ? 0 : 1; const at = ns === 1 ? t('common.enable') : t('common.disable'); try { await ElMessageBox.confirm(t('system.role.statusToggleConfirm', { action: at, name: row.postName }), t('common.confirm'), { type: ns === 1 ? 'success' : 'warning' }); await updatePost(row.id!, { postCode: row.postCode, postName: row.postName, sortNo: row.sortNo, status: ns }); ElMessage.success(t('common.success')); loadData(); } catch { /**/ } }
async function handleDelete(row?: PostRow) { const tgt = row || selectedRows.value[0]; if (!tgt) { ElMessage.warning(t('common.pleaseSelect')); return; } try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: tgt.postName }), t('common.delete'), { type: 'warning' }); await deletePost(tgt.id!); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch { /**/ } }
async function handleExport() {
    try {
        await exportPosts();
        ElMessage.success(t('common.export'));
    } catch (e) { ElMessage.error(e instanceof Error ? e.message : t('common.loadFailed')); }
}
function sv(v: unknown) { return String(v || '').trim() || undefined; }
function nv(v: unknown) { return typeof v === 'number' ? v : undefined; }
</script>
