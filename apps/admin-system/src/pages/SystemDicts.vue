<template>
    <section class="page">
        <div class="page-header">
            <div>
                <span class="eyebrow">Dictionary</span>
                <h1>字典管理</h1>
            </div>
            <el-button
                v-if="auth.hasPermission('admin:dict:save')"
                type="primary"
                @click="openCreateDialog"
            >
                新增{{ activeTab === 'types' ? '字典类型' : '字典数据' }}
            </el-button>
        </div>

        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="字典类型" name="types">
                <el-form :model="typeQuery" class="search-panel" inline>
                    <el-form-item label="字典名称">
                        <el-input v-model.trim="typeQuery.dictName" clearable placeholder="请输入字典名称" />
                    </el-form-item>
                    <el-form-item label="字典类型">
                        <el-input v-model.trim="typeQuery.dictType" clearable placeholder="请输入字典类型" />
                    </el-form-item>
                    <el-form-item label="业务域">
                        <el-input v-model.trim="typeQuery.bizDomain" clearable placeholder="请输入业务域" />
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-select v-model="typeQuery.status" clearable placeholder="全部" style="width: 120px">
                            <el-option
                                v-for="item in ENABLED_STATUS_OPTIONS"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button @click="resetTypeQuery">重置</el-button>
                        <el-button type="primary" @click="loadTypes">搜索</el-button>
                    </el-form-item>
                </el-form>

                <el-table :data="typeRows" border stripe v-loading="typeLoading" empty-text="暂无字典类型">
                    <el-table-column prop="dictName" label="字典名称" min-width="160" />
                    <el-table-column prop="dictType" label="字典类型" min-width="180" />
                    <el-table-column prop="bizDomain" label="业务域" width="140" />
                    <el-table-column prop="editable" label="允许编辑" width="110">
                        <template #default="{ row }">{{ yesNoLabel(row.editable) }}</template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 1 ? 'success' : 'info'">
                                {{ enabledStatusLabel(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="updatedAt" label="更新时间" width="180">
                        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="190" fixed="right">
                        <template #default="{ row }">
                            <el-button link type="primary" @click="selectType(row.dictType)">数据</el-button>
                            <el-button
                                v-if="auth.hasPermission('admin:dict:save')"
                                link
                                type="primary"
                                @click="openEditTypeDialog(row)"
                            >
                                编辑
                            </el-button>
                            <el-button
                                v-if="auth.hasPermission('admin:dict:delete')"
                                link
                                type="danger"
                                @click="handleDeleteType(row)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="pagination-bar">
                    <el-pagination
                        v-model:current-page="typeQuery.pageNo"
                        v-model:page-size="typeQuery.pageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        :total="typeTotal"
                        background
                        layout="total, sizes, prev, pager, next, jumper"
                        @size-change="loadTypes"
                        @current-change="loadTypes"
                    />
                </div>
            </el-tab-pane>

            <el-tab-pane label="字典数据" name="data">
                <el-form :model="dataQuery" class="search-panel" inline>
                    <el-form-item label="字典类型">
                        <el-input v-model.trim="dataQuery.dictType" clearable placeholder="请输入字典类型" />
                    </el-form-item>
                    <el-form-item label="字典标签">
                        <el-input v-model.trim="dataQuery.dictLabel" clearable placeholder="请输入字典标签" />
                    </el-form-item>
                    <el-form-item label="字典键值">
                        <el-input v-model.trim="dataQuery.dictValue" clearable placeholder="请输入字典键值" />
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-select v-model="dataQuery.status" clearable placeholder="全部" style="width: 120px">
                            <el-option
                                v-for="item in ENABLED_STATUS_OPTIONS"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button @click="resetDataQuery">重置</el-button>
                        <el-button type="primary" @click="loadData">搜索</el-button>
                    </el-form-item>
                </el-form>

                <el-table :data="dataRows" border stripe v-loading="dataLoading" empty-text="暂无字典数据">
                    <el-table-column prop="dictType" label="字典类型" min-width="180" />
                    <el-table-column prop="dictLabel" label="字典标签" min-width="160" />
                    <el-table-column prop="dictValue" label="字典键值" min-width="160" />
                    <el-table-column prop="locale" label="语言区域" width="120" />
                    <el-table-column prop="dictSort" label="排序" width="90" />
                    <el-table-column prop="isDefault" label="默认" width="90">
                        <template #default="{ row }">{{ yesNoLabel(row.isDefault) }}</template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 1 ? 'success' : 'info'">
                                {{ enabledStatusLabel(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="140" fixed="right">
                        <template #default="{ row }">
                            <el-button
                                v-if="auth.hasPermission('admin:dict:save')"
                                link
                                type="primary"
                                @click="openEditDataDialog(row)"
                            >
                                编辑
                            </el-button>
                            <el-button
                                v-if="auth.hasPermission('admin:dict:delete')"
                                link
                                type="danger"
                                @click="handleDeleteData(row)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="pagination-bar">
                    <el-pagination
                        v-model:current-page="dataQuery.pageNo"
                        v-model:page-size="dataQuery.pageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        :total="dataTotal"
                        background
                        layout="total, sizes, prev, pager, next, jumper"
                        @size-change="loadData"
                        @current-change="loadData"
                    />
                </div>
            </el-tab-pane>
        </el-tabs>

        <el-dialog v-model="typeDialogVisible" :title="typeDialogTitle" width="800px">
            <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="110px" class="form-grid">
                <el-form-item label="字典名称" prop="dictName">
                    <el-input v-model.trim="typeForm.dictName" maxlength="80" />
                </el-form-item>
                <el-form-item label="字典类型" prop="dictType">
                    <el-input v-model.trim="typeForm.dictType" :disabled="typeEditing" maxlength="100" />
                </el-form-item>
                <el-form-item label="业务域" prop="bizDomain">
                    <el-input v-model.trim="typeForm.bizDomain" maxlength="60" />
                </el-form-item>
                <el-form-item label="系统内置" prop="systemBuiltin">
                    <el-switch v-model="typeForm.systemBuiltin" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="允许编辑" prop="editable">
                    <el-switch v-model="typeForm.editable" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="typeForm.status">
                        <el-radio :value="1">启用</el-radio>
                        <el-radio :value="0">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注" prop="remark" class="form-full">
                    <el-input v-model="typeForm.remark" :rows="2" type="textarea" maxlength="200" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="typeDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="typeSaving" @click="submitTypeForm">保存</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="dataDialogVisible" :title="dataDialogTitle" width="800px">
            <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="110px" class="form-grid">
                <el-form-item label="字典类型" prop="dictType">
                    <el-input v-model.trim="dataForm.dictType" :disabled="dataEditing" maxlength="100" />
                </el-form-item>
                <el-form-item label="字典标签" prop="dictLabel">
                    <el-input v-model.trim="dataForm.dictLabel" maxlength="100" />
                </el-form-item>
                <el-form-item label="字典键值" prop="dictValue">
                    <el-input v-model.trim="dataForm.dictValue" :disabled="dataEditing" maxlength="100" />
                </el-form-item>
                <el-form-item label="父级值" prop="parentValue">
                    <el-input v-model.trim="dataForm.parentValue" maxlength="100" />
                </el-form-item>
                <el-form-item label="语言区域" prop="locale">
                    <el-input v-model.trim="dataForm.locale" placeholder="zh-CN" maxlength="20" />
                </el-form-item>
                <el-form-item label="排序" prop="dictSort">
                    <el-input-number v-model="dataForm.dictSort" :min="0" controls-position="right" />
                </el-form-item>
                <el-form-item label="默认值" prop="isDefault">
                    <el-switch v-model="dataForm.isDefault" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="dataForm.status">
                        <el-radio :value="1">启用</el-radio>
                        <el-radio :value="0">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="展示样式" prop="listClass">
                    <el-input v-model.trim="dataForm.listClass" maxlength="40" />
                </el-form-item>
                <el-form-item label="扩展 JSON" prop="extraJson" class="form-full">
                    <el-input v-model="dataForm.extraJson" :rows="3" type="textarea" />
                </el-form-item>
                <el-form-item label="备注" prop="remark" class="form-full">
                    <el-input v-model="dataForm.remark" :rows="2" type="textarea" maxlength="200" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dataDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="dataSaving" @click="submitDataForm">保存</el-button>
            </template>
        </el-dialog>
    </section>
</template>

<script setup lang="ts">
    import { computed, onMounted, reactive, ref } from 'vue';
    import type { FormInstance, FormRules } from 'element-plus';
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { ENABLED_STATUS_OPTIONS, formatDateTime, unwrapResult } from '@acquiring/shared';
    import {
        deleteDictData,
        deleteDictType,
        saveDictData,
        saveDictType,
        searchDictData,
        searchDictTypes,
        type SysDictData,
        type SysDictDataQuery,
        type SysDictDataSaveRequest,
        type SysDictType,
        type SysDictTypeQuery,
        type SysDictTypeSaveRequest,
    } from '@/api/dictApi';
    import { useAuthStore } from '@/stores/authStore';

    type DictTab = 'types' | 'data';

    const auth = useAuthStore();
    const activeTab = ref<DictTab>('types');
    const typeRows = ref<SysDictType[]>([]);
    const dataRows = ref<SysDictData[]>([]);
    const typeTotal = ref(0);
    const dataTotal = ref(0);
    const typeLoading = ref(false);
    const dataLoading = ref(false);
    const typeSaving = ref(false);
    const dataSaving = ref(false);
    const typeDialogVisible = ref(false);
    const dataDialogVisible = ref(false);
    const typeEditing = ref(false);
    const dataEditing = ref(false);
    const typeFormRef = ref<FormInstance>();
    const dataFormRef = ref<FormInstance>();
    const typeQuery = reactive<SysDictTypeQuery>({ pageNo: 1, pageSize: 20 });
    const dataQuery = reactive<SysDictDataQuery>({ pageNo: 1, pageSize: 20 });
    const typeForm = reactive<SysDictTypeSaveRequest>(createDefaultTypeForm());
    const dataForm = reactive<SysDictDataSaveRequest>(createDefaultDataForm());
    const typeDialogTitle = computed(() => (typeEditing.value ? '编辑字典类型' : '新增字典类型'));
    const dataDialogTitle = computed(() => (dataEditing.value ? '编辑字典数据' : '新增字典数据'));
    const typeRules: FormRules = {
        dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
        dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
    };
    const dataRules: FormRules = {
        dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
        dictLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
        dictValue: [{ required: true, message: '请输入字典键值', trigger: 'blur' }],
    };

    onMounted(loadTypes);

    function createDefaultTypeForm(): SysDictTypeSaveRequest {
        return {
            dictName: '',
            dictType: '',
            bizDomain: '',
            systemBuiltin: 0,
            editable: 1,
            status: 1,
            remark: '',
        };
    }

    function createDefaultDataForm(): SysDictDataSaveRequest {
        return {
            dictType: dataQuery.dictType || '',
            dictLabel: '',
            dictValue: '',
            parentValue: '',
            locale: 'zh-CN',
            dictSort: 0,
            listClass: '',
            extraJson: '',
            isDefault: 0,
            status: 1,
            remark: '',
        };
    }

    function handleTabChange(tabName: string | number) {
        activeTab.value = tabName as DictTab;
        if (activeTab.value === 'types') {
            loadTypes();
            return;
        }
        loadData();
    }

    async function loadTypes() {
        typeLoading.value = true;
        try {
            const page = unwrapResult((await searchDictTypes({ ...typeQuery })).data);
            typeRows.value = page.records || [];
            typeTotal.value = Number(page.total || 0);
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '字典类型加载失败');
        } finally {
            typeLoading.value = false;
        }
    }

    async function loadData() {
        dataLoading.value = true;
        try {
            const page = unwrapResult((await searchDictData({ ...dataQuery })).data);
            dataRows.value = page.records || [];
            dataTotal.value = Number(page.total || 0);
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '字典数据加载失败');
        } finally {
            dataLoading.value = false;
        }
    }

    function resetTypeQuery() {
        const pageSize = typeQuery.pageSize;
        Object.keys(typeQuery).forEach((key) => delete typeQuery[key as keyof SysDictTypeQuery]);
        Object.assign(typeQuery, { pageNo: 1, pageSize });
        loadTypes();
    }

    function resetDataQuery() {
        const pageSize = dataQuery.pageSize;
        Object.keys(dataQuery).forEach((key) => delete dataQuery[key as keyof SysDictDataQuery]);
        Object.assign(dataQuery, { pageNo: 1, pageSize });
        loadData();
    }

    function openCreateDialog() {
        if (activeTab.value === 'types') {
            typeEditing.value = false;
            Object.assign(typeForm, createDefaultTypeForm());
            typeDialogVisible.value = true;
            typeFormRef.value?.clearValidate();
            return;
        }
        dataEditing.value = false;
        Object.assign(dataForm, createDefaultDataForm());
        dataDialogVisible.value = true;
        dataFormRef.value?.clearValidate();
    }

    function openEditTypeDialog(row: SysDictType) {
        typeEditing.value = true;
        Object.assign(typeForm, createDefaultTypeForm(), row);
        typeDialogVisible.value = true;
        typeFormRef.value?.clearValidate();
    }

    function openEditDataDialog(row: SysDictData) {
        dataEditing.value = true;
        Object.assign(dataForm, createDefaultDataForm(), row);
        dataDialogVisible.value = true;
        dataFormRef.value?.clearValidate();
    }

    function selectType(dictType: string) {
        activeTab.value = 'data';
        Object.assign(dataQuery, { pageNo: 1, dictType });
        loadData();
    }

    async function submitTypeForm() {
        const valid = await typeFormRef.value?.validate().catch(() => false);
        if (!valid) {
            return;
        }
        typeSaving.value = true;
        try {
            unwrapResult((await saveDictType({ ...typeForm })).data);
            ElMessage.success('保存成功');
            typeDialogVisible.value = false;
            await loadTypes();
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '保存失败');
        } finally {
            typeSaving.value = false;
        }
    }

    async function submitDataForm() {
        const valid = await dataFormRef.value?.validate().catch(() => false);
        if (!valid) {
            return;
        }
        dataSaving.value = true;
        try {
            unwrapResult((await saveDictData({ ...dataForm })).data);
            ElMessage.success('保存成功');
            dataDialogVisible.value = false;
            await loadData();
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '保存失败');
        } finally {
            dataSaving.value = false;
        }
    }

    async function handleDeleteType(row: SysDictType) {
        const confirmed = await ElMessageBox.confirm(`确认删除字典类型 ${row.dictType}？`, '删除确认', {
            type: 'warning',
        }).catch(() => false);
        if (!confirmed) {
            return;
        }
        try {
            unwrapResult((await deleteDictType(row.dictType)).data);
            ElMessage.success('删除成功');
            await loadTypes();
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '删除失败');
        }
    }

    async function handleDeleteData(row: SysDictData) {
        const confirmed = await ElMessageBox.confirm(
            `确认删除字典数据 ${row.dictType}/${row.dictValue}？`,
            '删除确认',
            {
                type: 'warning',
            },
        ).catch(() => false);
        if (!confirmed) {
            return;
        }
        try {
            unwrapResult((await deleteDictData(row.dictType, row.dictValue)).data);
            ElMessage.success('删除成功');
            await loadData();
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '删除失败');
        }
    }

    function enabledStatusLabel(value?: number) {
        return value === 1 ? '启用' : '停用';
    }

    function yesNoLabel(value?: number) {
        return value === 1 ? '是' : '否';
    }
</script>
