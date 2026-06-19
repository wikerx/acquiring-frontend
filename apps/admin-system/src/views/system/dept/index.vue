<template>
    <div class="app-container">
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd()" v-hasPermi="'system:dept:add'">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'system:dept:export'">{{ $t('common.export') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="info" plain :icon="Sort" size="small" @click="toggleExpandAll">{{ $t('system.menu.expandCollapse') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar :show-search="false" @refresh="loadData" /></el-col>
        </el-row>
        <el-table v-if="refreshTable" v-loading="loading" :data="rows" row-key="id" :default-expand-all="isExpandAll" :tree-props="{ children: 'children' }" size="small">
            <el-table-column prop="deptName" :label="$t('system.dept.deptName')" min-width="200" :show-overflow-tooltip="true" />
            <el-table-column prop="sortNo" :label="$t('common.sort')" width="70" align="center" />
            <el-table-column prop="leader" :label="$t('system.dept.leader')" min-width="120" align="center" />
            <el-table-column prop="phone" :label="$t('system.dept.phone')" min-width="140" align="center" />
            <el-table-column :label="$t('common.status')" width="80" align="center">
                <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'system:dept:edit'" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="200" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:dept:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Plus" @click="handleAdd(row)" v-hasPermi="'system:dept:add'">{{ $t('common.add') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'system:dept:remove'">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog :title="dialogTitle" v-model="open" width="560px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding:0 20px">
                <el-form-item :label="$t('system.menu.parentMenu')" prop="parentId">
                    <el-tree-select v-model="form.parentId" :data="treeSelectData" node-key="id" :props="{ label: 'deptName', children: 'children' }" check-strictly :render-after-expand="false" default-expand-all style="width:100%" />
                </el-form-item>
                <el-form-item :label="$t('system.dept.deptName')" prop="deptName"><el-input v-model="form.deptName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('common.sort')" prop="sortNo"><el-input-number v-model="form.sortNo" :min="0" :max="9999" controls-position="right" /></el-form-item>
                <el-form-item :label="$t('system.dept.leader')" prop="leader"><el-input v-model="form.leader" maxlength="50" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.dept.phone')" prop="phone"><el-input v-model="form.phone" maxlength="30" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('system.user.email')" prop="email"><el-input v-model="form.email" maxlength="150" :placeholder="$t('common.pleaseInput')" /></el-form-item>
                <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="form.status" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" @click="submit">{{ $t('common.confirm') }}</el-button><el-button @click="open = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Edit, Delete, Sort, Refresh, Download } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { getDeptTree, createDept, updateDept, deleteDept, exportDepts, type SysDept } from '@/api/system/dept';

const { t } = useI18n();
const loading = ref(false); const rows = ref<SysDept[]>([]); const open = ref(false);
const formMode = ref<'create' | 'edit'>('create'); const activeRow = ref<SysDept | null>(null);
const formRef = ref<FormInstance>();
const isExpandAll = ref(true); const refreshTable = ref(true);
const dialogTitle = computed(() => formMode.value === 'create' ? t('common.add') : t('common.edit'));
const form = reactive<SysDept>({ deptName: '', parentId: 0, sortNo: 100, leader: '', phone: '', email: '', status: 1 });
const rules: FormRules = { deptName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }] };
const treeSelectData = computed(() => { const root: SysDept & { children?: SysDept[] } = { deptName: t('system.menu.rootDir'), id: 0, children: rows.value }; return [root]; });

onMounted(() => loadData());

async function loadData() { loading.value = true; try { rows.value = await getDeptTree(); } catch { rows.value = []; } finally { loading.value = false; } }
function toggleExpandAll() { refreshTable.value = false; isExpandAll.value = !isExpandAll.value; nextTick(() => { refreshTable.value = true; }); }

function handleAdd(row?: SysDept) { formMode.value = 'create'; activeRow.value = null; Object.assign(form, { id: undefined, parentId: row ? row.id : 0, deptName: '', sortNo: 100, leader: '', phone: '', email: '', status: 1 }); open.value = true; nextTick(() => formRef.value?.clearValidate()); }
function handleUpdate(row: SysDept) { formMode.value = 'edit'; activeRow.value = row; Object.assign(form, { id: row.id, parentId: row.parentId || 0, deptName: row.deptName, sortNo: row.sortNo, leader: row.leader || '', phone: row.phone || '', email: row.email || '', status: row.status }); open.value = true; nextTick(() => formRef.value?.clearValidate()); }
async function submit() { const v = await formRef.value?.validate().catch(() => false); if (!v) return; try { if (formMode.value === 'create') { await createDept({ deptName: form.deptName.trim(), parentId: form.parentId, sortNo: form.sortNo, leader: form.leader?.trim(), phone: form.phone?.trim(), email: form.email?.trim(), status: form.status }); ElMessage.success(t('common.addSuccess')); } else if (form.id) { await updateDept(form.id, { deptName: form.deptName.trim(), parentId: form.parentId, sortNo: form.sortNo, leader: form.leader?.trim(), phone: form.phone?.trim(), email: form.email?.trim(), status: form.status }); ElMessage.success(t('common.editSuccess')); } open.value = false; loadData(); } catch (e) { ElMessage.error(e instanceof Error ? e.message : t('common.saveFailed')); } }
async function toggleStatus(row: SysDept) { const ns = row.status === 1 ? 0 : 1; const at = ns === 1 ? t('common.enable') : t('common.disable'); try { await ElMessageBox.confirm(t('system.role.statusToggleConfirm', { action: at, name: row.deptName }), t('common.confirm'), { type: ns === 1 ? 'success' : 'warning' }); await updateDept(row.id!, { deptName: row.deptName, parentId: row.parentId ?? 0, sortNo: row.sortNo, leader: row.leader, phone: row.phone, email: row.email, status: ns }); ElMessage.success(t('common.success')); loadData(); } catch { /**/ } }
async function handleDelete(row: SysDept) { try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: row.deptName }), t('common.delete'), { type: 'warning' }); await deleteDept(row.id!); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch { /**/ } }
async function handleExport() {
    try {
        await exportDepts();
        ElMessage.success(t('common.export'));
    } catch (e) { ElMessage.error(e instanceof Error ? e.message : t('common.loadFailed')); }
}
</script>
