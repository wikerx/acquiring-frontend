<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('system.notice.title') }}</h1>
                
            </div>
        </div>

        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="$t('system.notice.noticeTitle')" align="center" prop="noticeTitle">
                <el-input v-model="query.noticeTitle" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="loadData" />
            </el-form-item>
            <el-form-item :label="$t('system.notice.operPerson')" align="center" prop="createBy">
                <el-input v-model="query.createBy" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="loadData" />
            </el-form-item>
            <el-form-item :label="$t('system.notice.noticeType')" align="center" prop="noticeType">
                <el-select v-model="query.noticeType" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option :label="$t('system.notice.typeNotice')" align="center" value="1" />
                    <el-option :label="$t('system.notice.typeAnnouncement')" align="center" value="2" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="loadData">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'system:notice:add'">{{ $t('common.add') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :icon="Edit" size="small" :disabled="!selectedRows.length || selectedRows.length !== 1" @click="handleUpdate(selectedRows[0])" v-hasPermi="'system:notice:edit'">{{ $t('common.edit') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete" v-hasPermi="'system:notice:remove'">{{ $t('common.delete') }}</el-button>
            </el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="noticeTitle" :label="$t('system.notice.noticeTitle')" align="center" min-width="200" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('system.notice.noticeType')" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.noticeType === '1' ? 'success' : 'info'" size="small">{{ row.noticeType === '1' ? $t('system.notice.typeNotice') : $t('system.notice.typeAnnouncement') }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('common.status')" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="createBy" :label="$t('system.notice.createBy')" align="center" min-width="120" />
            <el-table-column :label="$t('common.createTime')" align="center" min-width="160">
                <template #default="{ row }"><BaseDateTime :value="row.createTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="160" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:notice:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'system:notice:remove'">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination
                v-model:current-page="page" v-model:page-size="pageSize" :total="total"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background
                @size-change="loadData" @current-change="loadData"
            />
        </div>

        <el-dialog :title="dialogTitle" v-model="open" width="600px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item :label="$t('system.notice.noticeTitle')" align="center" prop="noticeTitle">
                    <el-input v-model="form.noticeTitle" :placeholder="$t('common.pleaseInput')" />
                </el-form-item>
                <el-form-item :label="$t('system.notice.noticeType')" align="center" prop="noticeType">
                    <el-select v-model="form.noticeType" :placeholder="$t('common.pleaseSelect')">
                        <el-option :label="$t('system.notice.typeNotice')" align="center" value="1" />
                        <el-option :label="$t('system.notice.typeAnnouncement')" align="center" value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('common.status')" align="center">
                    <el-radio-group v-model="form.status">
                        <el-radio :value="1">{{ $t('common.enable') }}</el-radio>
                        <el-radio :value="0">{{ $t('common.disable') }}</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item :label="$t('system.notice.noticeContent')" align="center">
                    <el-input v-model="form.noticeContent" type="textarea" :rows="4" :placeholder="$t('common.pleaseInput')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="open = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="detailVisible" :title="$t('system.notice.detailTitle')" width="600px" append-to-body destroy-on-close>
            <el-descriptions :column="1" border size="small">
                <el-descriptions-item :label="$t('system.notice.noticeTitle')" align="center">{{ activeRow?.noticeTitle || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.notice.noticeType')" align="center">{{ activeRow?.noticeType === '1' ? $t('system.notice.typeNotice') : $t('system.notice.typeAnnouncement') }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')" align="center">{{ activeRow?.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.notice.createBy')" align="center">{{ activeRow?.createBy || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.createTime')" align="center"><BaseDateTime :value="String(activeRow?.createTime || '')" /></el-descriptions-item>
                <el-descriptions-item :label="$t('system.notice.noticeContent')" align="center">{{ activeRow?.noticeContent || '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <div class="dialog-footer"><el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button></div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchNotices, createNotice, updateNotice, deleteNotice, type SysNotice } from '@/api/system/notice';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const showSearch = ref(true);
const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const rows = ref<Array<Record<string, unknown>>>([]);
const selectedRows = ref<Array<Record<string, unknown>>>([]);
const total = ref(0);
const page = ref(1); const pageSize = ref(10);
const open = ref(false);
const detailVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeRow = ref<Record<string, unknown> | null>(null);
const formRef = ref<FormInstance>();

const dialogTitle = computed(() => formMode.value === 'create' ? t('system.notice.addNotice') : t('system.notice.editNotice'));

const form = reactive({ noticeTitle: '', noticeType: '1', status: 1, noticeContent: '' });
const rules: FormRules = {
    noticeTitle: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    noticeType: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
};

onMounted(() => loadData());
async function loadData() {
    loading.value = true;
    try {
        const result = await searchNotices({
            pageNo: page.value, pageSize: pageSize.value,
            noticeTitle: String(query.noticeTitle || '').trim() || undefined,
            noticeType: String(query.noticeType || '').trim() || undefined,
            createBy: String(query.createBy || '').trim() || undefined,
        });
        rows.value = result.records as unknown as Record<string, unknown>[];
        total.value = result.total;
    } catch { rows.value = []; total.value = 0; }
    finally { loading.value = false; }
}
function resetQuery() { Object.keys(query).forEach(k => query[k] = ''); loadData(); }
function handleSelectionChange(s: Array<Record<string, unknown>>) { selectedRows.value = s; }

function handleAdd() { formMode.value = 'create'; activeRow.value = null; Object.assign(form, { noticeTitle: '', noticeType: '1', status: 1, noticeContent: '' }); open.value = true; nextTick(() => formRef.value?.clearValidate()); }
function handleUpdate(row: Record<string, unknown>) { formMode.value = 'edit'; activeRow.value = row; Object.assign(form, { noticeTitle: row.noticeTitle, noticeType: row.noticeType, status: row.status, noticeContent: row.noticeContent }); open.value = true; nextTick(() => formRef.value?.clearValidate()); }
function openDetail(row: Record<string, unknown>) { activeRow.value = row; detailVisible.value = true; }

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    try {
        const data: SysNotice = { noticeTitle: form.noticeTitle, noticeType: form.noticeType, noticeContent: form.noticeContent, status: form.status };
        if (formMode.value === 'create') { await createNotice(data); } else if (activeRow.value?.id) { await updateNotice(Number(activeRow.value.id), data); }
        ElMessage.success(formMode.value === 'create' ? t('common.addSuccess') : t('common.editSuccess')); open.value = false; loadData();
    } catch (e: unknown) { ElMessage.error(e instanceof Error ? e.message : t('common.saveFailed')); }
}
async function handleDelete(row?: Record<string, unknown>) {
    const target = row || selectedRows.value[0];
    if (!target) { ElMessage.warning(t('system.notice.selectNotice')); return; }
    try {
        await ElMessageBox.confirm(t('system.notice.deleteConfirm'), t('common.delete'), { type: 'warning' });
        if (target.id) await deleteNotice(Number(target.id));
        ElMessage.success(t('common.deleteSuccess')); loadData();
    } catch { /* cancelled */ }
}
</script>
