<template>
    <div class="page system-page">
        <el-form :model="query" inline size="small" class="search-form">
            <el-form-item :label="t('system.account.keyword')"><el-input v-model="query.keyword" :placeholder="t('system.account.keywordPlaceholder')" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item :label="t('system.account.role')"><el-select v-model="query.roleId" class="search-form__select--wide" :placeholder="t('common.all')" clearable><el-option v-for="role in roles" :key="role.roleId" :label="role.roleName" :value="role.roleId" /></el-select></el-form-item>
            <el-form-item :label="t('common.status')"><el-select v-model="query.status" :placeholder="t('common.all')" clearable><el-option :label="t('common.enabled')" :value="1" /><el-option :label="t('common.disabled')" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <div class="toolbar"><el-button v-if="canAdd" type="primary" plain size="small" :icon="Plus" @click="openForm()">{{ t('system.account.addEmployee') }}</el-button><el-button plain size="small" :icon="Refresh" @click="loadData">{{ t('common.refresh') }}</el-button></div>
        <el-table v-loading="loading" :data="rows" row-key="accountId" size="small">
            <el-table-column prop="loginAccount" :label="t('system.account.loginAccount')" min-width="160" />
            <el-table-column prop="realName" :label="t('system.account.realName')" min-width="140" />
            <el-table-column prop="mobile" :label="t('system.account.mobile')" min-width="140" />
            <el-table-column prop="email" :label="t('system.account.email')" min-width="180" />
            <el-table-column :label="t('system.account.role')" min-width="180"><template #default="{ row }">{{ row.roleNames?.join(', ') || '-' }}</template></el-table-column>
            <el-table-column :label="t('common.status')" width="100" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? t('common.enabled') : t('common.disabled') }}</el-tag></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="240" align="center" class-name="small-padding fixed-width">
                <template #default="{ row }">
                    <el-button v-if="canEdit || canAssignRole" size="small" link type="primary" :icon="Edit" @click="openForm(row)">{{ t('common.edit') }}</el-button>
                    <el-button v-if="canChangeStatus" size="small" link type="primary" :icon="row.status === 1 ? CircleClose : CircleCheck" @click="toggleStatus(row)">{{ row.status === 1 ? t('common.disabled') : t('common.enabled') }}</el-button>
                    <el-button v-if="canDelete" size="small" link type="danger" :icon="Delete" @click="remove(row)">{{ t('common.delete') }}</el-button>
                    <span v-if="!canEdit && !canAssignRole && !canChangeStatus && !canDelete">-</span>
                </template>
            </el-table-column>
        </el-table>
        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>
        <el-dialog v-model="visible" :title="form.accountId ? t('system.account.editEmployee') : t('system.account.addEmployee')" width="560px">
            <el-form :model="form" label-width="92px">
                <el-form-item :label="t('system.account.loginAccount')"><el-input v-model="form.loginAccount" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item v-if="!form.accountId" :label="t('system.account.initialPassword')"><el-input v-model="form.password" type="password" show-password /></el-form-item>
                <el-form-item :label="t('system.account.realName')"><el-input v-model="form.realName" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item :label="t('system.account.mobile')"><el-input v-model="form.mobile" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item :label="t('system.account.email')"><el-input v-model="form.email" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item :label="t('system.account.role')"><el-select v-model="form.roleIds" multiple style="width:100%" :disabled="!canAssignRole"><el-option v-for="role in roles" :key="role.roleId" :label="role.roleName" :value="role.roleId" /></el-select></el-form-item>
                <el-form-item :label="t('system.account.dept')"><el-tree-select v-model="form.deptIds" multiple :data="deptTree" node-key="deptId" :props="{ label: 'deptName', value: 'deptId', children: 'children' }" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item :label="t('system.account.post')"><el-select v-model="form.postIds" multiple style="width:100%" :disabled="!canSaveAccountBase"><el-option v-for="post in posts" :key="post.postId" :label="post.postName" :value="post.postId" /></el-select></el-form-item>
                <el-form-item :label="t('common.status')"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" :disabled="!canSaveAccountBase && !canChangeStatus" /></el-form-item>
            </el-form>
            <template #footer><el-button size="small" @click="visible = false">{{ t('common.cancel') }}</el-button><el-button v-if="canSaveAccountBase || canAssignRole" type="primary" size="small" @click="submit">{{ t('common.save') }}</el-button></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CircleCheck, CircleClose, Delete, Edit, Plus, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { systemApi, type AccountItem, type DeptItem, type PostItem, type RoleItem } from '@/api/systemApi';
import { hasPermission } from '@/utils/permission';

const { t } = useI18n();
const loading = ref(false);
const visible = ref(false);
const rows = ref<AccountItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const roles = ref<RoleItem[]>([]);
const posts = ref<PostItem[]>([]);
const deptTree = ref<DeptItem[]>([]);
const query = reactive<{ keyword: string; roleId?: number; status?: number }>({ keyword: '' });
const form = reactive<Partial<AccountItem> & { password?: string }>({ status: 1, roleIds: [], deptIds: [], postIds: [] });
const canAdd = hasPermission('merchant:system:account:add');
const canEdit = hasPermission('merchant:system:account:edit');
const canDelete = hasPermission('merchant:system:account:delete');
const canChangeStatus = hasPermission('merchant:system:account:status');
const canAssignRole = hasPermission('merchant:system:account:assignRole');
const canSaveAccountBase = computed(() => form.accountId ? canEdit : canAdd);

async function loadData() {
    loading.value = true;
    try {
        const [accountPage, roleRows, postRows, deptRows] = await Promise.all([
            systemApi.pageAccounts({
                pageNo: page.value,
                pageSize: pageSize.value,
                keyword: query.keyword.trim() || undefined,
                roleId: query.roleId,
                status: query.status,
            }),
            systemApi.roles(),
            systemApi.posts(),
            systemApi.deptTree(),
        ]);
        rows.value = accountPage.records;
        total.value = accountPage.total;
        roles.value = roleRows;
        posts.value = postRows;
        deptTree.value = deptRows;
    } finally {
        loading.value = false;
    }
}

function applyQuery() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    query.keyword = '';
    query.roleId = undefined;
    query.status = undefined;
    applyQuery();
}

function openForm(row?: AccountItem) {
    Object.assign(form, row ? { ...row, password: undefined } : { accountId: undefined, loginAccount: '', password: '', realName: '', mobile: '', email: '', status: 1, roleIds: [], deptIds: [], postIds: [] });
    visible.value = true;
}

async function submit() {
    if (!form.accountId) {
        await systemApi.saveAccount(form);
    } else {
        const tasks: Promise<unknown>[] = [];
        if (canEdit) {
            tasks.push(systemApi.saveAccount(form, form.accountId));
            tasks.push(systemApi.assignAccountDepts(form.accountId, form.deptIds || []));
            tasks.push(systemApi.assignAccountPosts(form.accountId, form.postIds || []));
        }
        if (canAssignRole) {
            tasks.push(systemApi.assignAccountRoles(form.accountId, form.roleIds || []));
        }
        await Promise.all(tasks);
    }
    ElMessage.success(t('common.saveSuccess'));
    visible.value = false;
    await loadData();
}

async function toggleStatus(row: AccountItem) {
    await systemApi.changeAccountStatus(row.accountId, row.status === 1 ? 0 : 1);
    await loadData();
}

async function remove(row: AccountItem) {
    await ElMessageBox.confirm(t('system.account.deleteConfirm', { name: row.loginAccount }), t('common.deleteConfirmTitle'), { type: 'warning' });
    await systemApi.deleteAccount(row.accountId);
    ElMessage.success(t('common.deleteSuccess'));
    await loadData();
}

onMounted(loadData);
</script>
