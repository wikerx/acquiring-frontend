<template>
    <div class="page system-page">
        <el-form :model="query" inline size="small" class="search-form">
            <el-form-item label="关键字"><el-input v-model="query.keyword" placeholder="账号/姓名/手机号/邮箱" clearable @keyup.enter="applyQuery" /></el-form-item>
            <el-form-item label="角色"><el-select v-model="query.roleId" class="search-form__select--wide" placeholder="全部" clearable><el-option v-for="role in roles" :key="role.roleId" :label="role.roleName" :value="role.roleId" /></el-select></el-form-item>
            <el-form-item label="状态"><el-select v-model="query.status" placeholder="全部" clearable><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" @click="applyQuery">查询</el-button><el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button></el-form-item>
        </el-form>
        <div class="toolbar"><el-button v-if="canAdd" type="primary" plain size="small" :icon="Plus" @click="openForm()">新增员工</el-button><el-button plain size="small" :icon="Refresh" @click="loadData">刷新</el-button></div>
        <el-table v-loading="loading" :data="filteredRows" row-key="accountId" size="small">
            <el-table-column prop="loginAccount" label="登录账号" min-width="160" />
            <el-table-column prop="realName" label="姓名" min-width="140" />
            <el-table-column prop="mobile" label="手机号" min-width="140" />
            <el-table-column prop="email" label="邮箱" min-width="180" />
            <el-table-column label="角色" min-width="180"><template #default="{ row }">{{ row.roleNames?.join(', ') || '-' }}</template></el-table-column>
            <el-table-column label="状态" width="100" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="240" align="center">
                <template #default="{ row }">
                    <el-button v-if="canEdit || canAssignRole" link type="primary" @click="openForm(row)">编辑</el-button>
                    <el-button v-if="canChangeStatus" link type="primary" @click="toggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button>
                    <el-button v-if="canDelete" link type="danger" @click="remove(row)">删除</el-button>
                    <span v-if="!canEdit && !canAssignRole && !canChangeStatus && !canDelete">-</span>
                </template>
            </el-table-column>
        </el-table>
        <el-dialog v-model="visible" :title="form.accountId ? '编辑员工' : '新增员工'" width="560px">
            <el-form :model="form" label-width="92px">
                <el-form-item label="登录账号"><el-input v-model="form.loginAccount" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item v-if="!form.accountId" label="初始密码"><el-input v-model="form.password" type="password" show-password /></el-form-item>
                <el-form-item label="姓名"><el-input v-model="form.realName" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item label="手机号"><el-input v-model="form.mobile" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item label="邮箱"><el-input v-model="form.email" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item label="角色"><el-select v-model="form.roleIds" multiple style="width:100%" :disabled="!canAssignRole"><el-option v-for="role in roles" :key="role.roleId" :label="role.roleName" :value="role.roleId" /></el-select></el-form-item>
                <el-form-item label="部门"><el-tree-select v-model="form.deptIds" multiple :data="deptTree" node-key="deptId" :props="{ label: 'deptName', value: 'deptId', children: 'children' }" :disabled="!canSaveAccountBase" /></el-form-item>
                <el-form-item label="岗位"><el-select v-model="form.postIds" multiple style="width:100%" :disabled="!canSaveAccountBase"><el-option v-for="post in posts" :key="post.postId" :label="post.postName" :value="post.postId" /></el-select></el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" :disabled="!canSaveAccountBase && !canChangeStatus" /></el-form-item>
            </el-form>
            <template #footer><el-button size="small" @click="visible = false">取消</el-button><el-button v-if="canSaveAccountBase || canAssignRole" type="primary" size="small" @click="submit">保存</el-button></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue';
import { systemApi, type AccountItem, type DeptItem, type PostItem, type RoleItem } from '@/api/systemApi';
import { hasPermission } from '@/utils/permission';

const loading = ref(false);
const visible = ref(false);
const rows = ref<AccountItem[]>([]);
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
const filteredRows = computed(() => {
    const keyword = query.keyword.trim().toLowerCase();
    return rows.value.filter((item) => {
        const matchedKeyword = !keyword
            || item.loginAccount.toLowerCase().includes(keyword)
            || item.realName.toLowerCase().includes(keyword)
            || (item.mobile || '').toLowerCase().includes(keyword)
            || (item.email || '').toLowerCase().includes(keyword);
        const matchedRole = query.roleId === undefined || item.roleIds.includes(query.roleId);
        const matchedStatus = query.status === undefined || item.status === query.status;
        return matchedKeyword && matchedRole && matchedStatus;
    });
});

async function loadData() {
    loading.value = true;
    try {
        const [accountRows, roleRows, postRows, deptRows] = await Promise.all([
            systemApi.accounts(),
            systemApi.roles(),
            systemApi.posts(),
            systemApi.deptTree(),
        ]);
        rows.value = accountRows;
        roles.value = roleRows;
        posts.value = postRows;
        deptTree.value = deptRows;
    } finally {
        loading.value = false;
    }
}

function applyQuery() {}

function resetQuery() {
    query.keyword = '';
    query.roleId = undefined;
    query.status = undefined;
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
    ElMessage.success('保存成功');
    visible.value = false;
    await loadData();
}

async function toggleStatus(row: AccountItem) {
    await systemApi.changeAccountStatus(row.accountId, row.status === 1 ? 0 : 1);
    await loadData();
}

async function remove(row: AccountItem) {
    await ElMessageBox.confirm(`确认删除员工 ${row.loginAccount}？`, '删除确认', { type: 'warning' });
    await systemApi.deleteAccount(row.accountId);
    ElMessage.success('删除成功');
    await loadData();
}

onMounted(loadData);
</script>
