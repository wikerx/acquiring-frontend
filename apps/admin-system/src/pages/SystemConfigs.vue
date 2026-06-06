<template>
    <section class="page">
        <div class="page-header">
            <div>
                <span class="eyebrow">System</span>
                <h1>参数设置</h1>
            </div>
            <el-button
                v-if="auth.hasPermission('admin:config:save')"
                type="primary"
                @click="openCreateDialog"
            >
                新增配置
            </el-button>
        </div>

        <el-form :model="query" class="search-panel" inline>
            <el-form-item label="参数名称">
                <el-input v-model.trim="query.configName" clearable placeholder="请输入参数名称" />
            </el-form-item>
            <el-form-item label="参数键名">
                <el-input v-model.trim="query.configKey" clearable placeholder="请输入参数键名" />
            </el-form-item>
            <el-form-item label="分组">
                <el-input v-model.trim="query.configGroup" clearable placeholder="请输入配置分组" />
            </el-form-item>
            <el-form-item label="状态">
                <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
                    <el-option
                        v-for="item in ENABLED_STATUS_OPTIONS"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button @click="resetQuery">重置</el-button>
                <el-button type="primary" @click="loadConfigs">搜索</el-button>
            </el-form-item>
        </el-form>

        <el-table :data="rows" border stripe v-loading="loading" empty-text="暂无参数配置">
            <el-table-column prop="configName" label="名称" min-width="160" />
            <el-table-column prop="configKey" label="键名" min-width="220" show-overflow-tooltip />
            <el-table-column prop="configGroup" label="分组" width="140" />
            <el-table-column prop="valueType" label="值类型" width="110">
                <template #default="{ row }">{{ valueTypeLabel(row.valueType) }}</template>
            </el-table-column>
            <el-table-column prop="visible" label="前端可见" width="110">
                <template #default="{ row }">
                    <el-tag :type="row.visible === 1 ? 'success' : 'info'">
                        {{ yesNoLabel(row.visible) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="encrypted" label="加密" width="90">
                <template #default="{ row }">{{ yesNoLabel(row.encrypted) }}</template>
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
            <el-table-column label="操作" width="160" fixed="right">
                <template #default="{ row }">
                    <el-button
                        v-if="auth.hasPermission('admin:config:save')"
                        link
                        type="primary"
                        @click="openEditDialog(row)"
                    >
                        编辑
                    </el-button>
                    <el-button
                        v-if="auth.hasPermission('admin:config:delete')"
                        link
                        type="danger"
                        @click="handleDelete(row)"
                    >
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-bar">
            <el-pagination
                v-model:current-page="query.pageNo"
                v-model:page-size="query.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="total"
                background
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadConfigs"
                @current-change="loadConfigs"
            />
        </div>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="form-grid">
                <el-form-item label="参数名称" prop="configName">
                    <el-input v-model.trim="form.configName" maxlength="80" />
                </el-form-item>
                <el-form-item label="参数键名" prop="configKey">
                    <el-input v-model.trim="form.configKey" :disabled="editing" maxlength="120" />
                </el-form-item>
                <el-form-item label="参数值" prop="configValue" class="form-full">
                    <el-input v-model="form.configValue" :rows="3" type="textarea" />
                </el-form-item>
                <el-form-item label="值类型" prop="valueType">
                    <el-select v-model="form.valueType">
                        <el-option label="字符串" :value="1" />
                        <el-option label="数字" :value="2" />
                        <el-option label="布尔" :value="3" />
                        <el-option label="JSON" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item label="配置分组" prop="configGroup">
                    <el-input v-model.trim="form.configGroup" maxlength="60" />
                </el-form-item>
                <el-form-item label="系统内置" prop="systemBuiltin">
                    <el-switch v-model="form.systemBuiltin" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="前端可见" prop="visible">
                    <el-switch v-model="form.visible" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="加密存储" prop="encrypted">
                    <el-switch v-model="form.encrypted" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio :value="1">启用</el-radio>
                        <el-radio :value="0">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注" prop="remark" class="form-full">
                    <el-input v-model="form.remark" :rows="2" type="textarea" maxlength="200" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
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
        deleteConfig,
        saveConfig,
        searchConfigs,
        type SysConfig,
        type SysConfigQuery,
        type SysConfigSaveRequest,
    } from '@/api/configApi';
    import { useAuthStore } from '@/stores/authStore';

    const auth = useAuthStore();
    const rows = ref<SysConfig[]>([]);
    const total = ref(0);
    const loading = ref(false);
    const saving = ref(false);
    const dialogVisible = ref(false);
    const editing = ref(false);
    const formRef = ref<FormInstance>();
    const query = reactive<SysConfigQuery>({ pageNo: 1, pageSize: 20 });
    const form = reactive<SysConfigSaveRequest>(createDefaultForm());
    const dialogTitle = computed(() => (editing.value ? '编辑配置' : '新增配置'));
    const rules: FormRules = {
        configName: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
        configKey: [{ required: true, message: '请输入参数键名', trigger: 'blur' }],
        valueType: [{ required: true, message: '请选择值类型', trigger: 'change' }],
    };

    onMounted(loadConfigs);

    function createDefaultForm(): SysConfigSaveRequest {
        return {
            configName: '',
            configKey: '',
            configValue: '',
            valueType: 1,
            configGroup: '',
            systemBuiltin: 0,
            visible: 1,
            encrypted: 0,
            status: 1,
            remark: '',
        };
    }

    async function loadConfigs() {
        loading.value = true;
        try {
            const page = unwrapResult((await searchConfigs({ ...query })).data);
            rows.value = page.records || [];
            total.value = Number(page.total || 0);
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '参数配置加载失败');
        } finally {
            loading.value = false;
        }
    }

    function resetQuery() {
        const pageSize = query.pageSize;
        Object.keys(query).forEach((key) => delete query[key as keyof SysConfigQuery]);
        Object.assign(query, { pageNo: 1, pageSize });
        loadConfigs();
    }

    function openCreateDialog() {
        editing.value = false;
        Object.assign(form, createDefaultForm());
        dialogVisible.value = true;
        formRef.value?.clearValidate();
    }

    function openEditDialog(row: SysConfig) {
        editing.value = true;
        Object.assign(form, createDefaultForm(), row);
        dialogVisible.value = true;
        formRef.value?.clearValidate();
    }

    async function submitForm() {
        const valid = await formRef.value?.validate().catch(() => false);
        if (!valid) {
            return;
        }
        saving.value = true;
        try {
            unwrapResult((await saveConfig({ ...form })).data);
            ElMessage.success('保存成功');
            dialogVisible.value = false;
            await loadConfigs();
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '保存失败');
        } finally {
            saving.value = false;
        }
    }

    async function handleDelete(row: SysConfig) {
        const confirmed = await ElMessageBox.confirm(`确认删除配置 ${row.configKey}？`, '删除确认', {
            type: 'warning',
        }).catch(() => false);
        if (!confirmed) {
            return;
        }
        try {
            unwrapResult((await deleteConfig(row.configKey)).data);
            ElMessage.success('删除成功');
            await loadConfigs();
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '删除失败');
        }
    }

    function valueTypeLabel(value?: number) {
        return ({ 1: '字符串', 2: '数字', 3: '布尔', 4: 'JSON' } as Record<number, string>)[
            value || 1
        ];
    }

    function enabledStatusLabel(value?: number) {
        return value === 1 ? '启用' : '停用';
    }

    function yesNoLabel(value?: number) {
        return value === 1 ? '是' : '否';
    }
</script>
