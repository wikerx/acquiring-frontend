<template>
    <div class="app-container">
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

        <StandardTable table-key="system-notice" v-loading="loading" :data="rows" row-key="id" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column :label="$t('common.index')" width="86" align="center">
                <template #default="{ $index }">No.{{ (page - 1) * pageSize + $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="noticeTitle" :label="$t('system.notice.noticeTitle')" align="center" min-width="260" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <el-button type="primary" link class="notice-title-link" @click="openDetail(row)">{{ row.noticeTitle }}</el-button>
                </template>
            </el-table-column>
            <el-table-column :label="$t('system.notice.noticeType')" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.noticeType === '1' ? 'warning' : 'success'" size="small">{{ row.noticeType === '1' ? $t('system.notice.typeNotice') : $t('system.notice.typeAnnouncement') }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('common.status')" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="createBy" :label="$t('system.notice.createBy')" align="center" min-width="120" />
            <el-table-column :label="$t('common.createTime')" align="center" min-width="160">
                <template #default="{ row }"><BaseDateTime :value="row.createdAt" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="190" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:notice:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'system:notice:remove'">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination
                v-model:current-page="page" v-model:page-size="pageSize" :total="total"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background
                @size-change="loadData" @current-change="loadData"
            />
        </div>

        <el-dialog :title="dialogTitle" v-model="open" width="min(1120px, 92vw)" top="5vh" append-to-body destroy-on-close class="notice-editor-dialog">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="notice-form">
                <div class="notice-form__grid">
                    <el-form-item :label="$t('system.notice.noticeTitle')" prop="noticeTitle">
                        <el-input v-model="form.noticeTitle" :placeholder="$t('common.pleaseInput')" maxlength="120" show-word-limit />
                    </el-form-item>
                    <el-form-item :label="$t('system.notice.noticeType')" prop="noticeType">
                        <el-select v-model="form.noticeType" :placeholder="$t('common.pleaseSelect')" style="width: 100%">
                            <el-option :label="$t('system.notice.typeNotice')" value="1" />
                            <el-option :label="$t('system.notice.typeAnnouncement')" value="2" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('common.status')" class="notice-form__status">
                        <el-radio-group v-model="form.status">
                            <el-radio :value="1">{{ $t('common.enable') }}</el-radio>
                            <el-radio :value="0">{{ $t('common.disable') }}</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </div>
                <el-form-item :label="$t('system.notice.noticeContent')" prop="noticeContent" class="notice-content-form-item">
                    <el-input
                        v-model="form.noticeContent"
                        type="textarea"
                        :rows="18"
                        resize="vertical"
                        maxlength="8000"
                        show-word-limit
                        :placeholder="$t('system.notice.contentPlaceholder')"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="open = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('system.notice.detailTitle')" size="full">
            <article v-if="activeRow" class="notice-detail">
                <div class="notice-detail__type">
                    <el-tag :type="activeRow.noticeType === '1' ? 'warning' : 'success'" size="small">
                        {{ activeRow.noticeType === '1' ? $t('system.notice.typeNotice') : $t('system.notice.typeAnnouncement') }}
                    </el-tag>
                </div>
                <h2>{{ activeRow.noticeTitle }}</h2>
                <div class="notice-detail__meta">
                    <span>{{ activeRow.createBy || '-' }}</span>
                    <span><BaseDateTime :value="activeRow.createdAt" /></span>
                    <span>{{ activeRow.status === 1 ? $t('common.enable') : $t('common.disable') }}</span>
                </div>
                <div class="notice-detail__content">{{ activeRow.noticeContent || '-' }}</div>
            </article>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { searchNotices, createNotice, updateNotice, deleteNotice, getNotice, type SysNotice } from '@/api/system/notice';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const showSearch = ref(true);
const query = reactive<{ noticeTitle?: string; noticeType?: string; createBy?: string }>({});
const loading = ref(false);
const rows = ref<SysNotice[]>([]);
const selectedRows = ref<SysNotice[]>([]);
const total = ref(0);
const page = ref(1); const pageSize = ref(10);
const open = ref(false);
const detailVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeRow = ref<SysNotice | null>(null);
const formRef = ref<FormInstance>();

const dialogTitle = computed(() => formMode.value === 'create' ? t('system.notice.addNotice') : t('system.notice.editNotice'));

const form = reactive({ noticeTitle: '', noticeType: '1', status: 1, noticeContent: '' });
const rules: FormRules = {
    noticeTitle: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    noticeType: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    noticeContent: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
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
        rows.value = result.records || [];
        total.value = result.total;
    } catch { rows.value = []; total.value = 0; }
    finally { loading.value = false; }
}
function resetQuery() {
    query.noticeTitle = '';
    query.noticeType = '';
    query.createBy = '';
    loadData();
}
function handleSelectionChange(s: SysNotice[]) { selectedRows.value = s; }

function handleAdd() { formMode.value = 'create'; activeRow.value = null; Object.assign(form, { noticeTitle: '', noticeType: '1', status: 1, noticeContent: '' }); open.value = true; nextTick(() => formRef.value?.clearValidate()); }
async function handleUpdate(row: SysNotice) {
    formMode.value = 'edit';
    activeRow.value = row.id ? await getNotice(row.id) : row;
    Object.assign(form, {
        noticeTitle: activeRow.value.noticeTitle,
        noticeType: activeRow.value.noticeType,
        status: activeRow.value.status ?? 1,
        noticeContent: activeRow.value.noticeContent || '',
    });
    open.value = true;
    nextTick(() => formRef.value?.clearValidate());
}
async function openDetail(row: SysNotice) {
    activeRow.value = row.id ? await getNotice(row.id) : row;
    detailVisible.value = true;
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    try {
        const data: SysNotice = { noticeTitle: form.noticeTitle, noticeType: form.noticeType, noticeContent: form.noticeContent, status: form.status };
        if (formMode.value === 'create') { await createNotice(data); } else if (activeRow.value?.id) { await updateNotice(Number(activeRow.value.id), data); }
        ElMessage.success(formMode.value === 'create' ? t('common.addSuccess') : t('common.editSuccess')); open.value = false; loadData();
    } catch (e: unknown) { ElMessage.error(e instanceof Error ? e.message : t('common.saveFailed')); }
}
async function handleDelete(row?: SysNotice) {
    const targets = row ? [row] : selectedRows.value;
    if (!targets.length) { ElMessage.warning(t('system.notice.selectNotice')); return; }
    const ids = targets.filter((item) => item.id).map((item) => Number(item.id));
    if (!ids.length) { ElMessage.warning(t('system.notice.selectNotice')); return; }
    try {
        await ElMessageBox.confirm(t('system.notice.deleteConfirm'), t('common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await deleteNotice(ids);
        ElMessage.success(t('common.deleteSuccess'));
        loadData();
    } catch (e: unknown) {
        ElMessage.error(e instanceof Error ? e.message : t('common.deleteFailed'));
    }
}
</script>

<style scoped>
.notice-title-link {
    max-width: 100%;
    vertical-align: middle;
}

.notice-form__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 18px 24px;
}

.notice-form__status {
    grid-column: 1 / -1;
}

.notice-content-form-item :deep(.el-textarea__inner) {
    min-height: 360px !important;
    line-height: 1.7;
}

.notice-detail {
    max-width: 760px;
    margin: 0 auto;
    padding: 8px 0 24px;
}

.notice-detail__type {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
}

.notice-detail h2 {
    margin: 0;
    color: #0f172a;
    font-size: 22px;
    line-height: 1.35;
    text-align: center;
}

.notice-detail__meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 18px;
    margin-top: 16px;
    padding-bottom: 18px;
    border-bottom: 1px solid #edf1f7;
    color: #64748b;
    font-size: 13px;
}

.notice-detail__content {
    min-height: 260px;
    margin-top: 26px;
    padding: 28px 32px;
    border: 1px solid #edf1f7;
    border-radius: 8px;
    background: #fff;
    color: #1f2937;
    font-size: 14px;
    line-height: 1.9;
    white-space: pre-wrap;
    word-break: break-word;
}

@media (max-width: 768px) {
    .notice-form__grid {
        grid-template-columns: 1fr;
    }

    .notice-content-form-item :deep(.el-textarea__inner) {
        min-height: 280px !important;
    }

    .notice-detail__content {
        padding: 20px;
    }
}
</style>
