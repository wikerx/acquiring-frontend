<template>
    <div class="app-container merchant-user-query-page">
        <el-form ref="queryFormRef" :model="query" :inline="true" size="small" class="search-form" label-width="82px">
            <el-form-item label="商户号" prop="merchantId"><el-input v-model="query.merchantId" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="商户名称" prop="merchantName"><el-input v-model="query.merchantName" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="登录账号" prop="loginAccount"><el-input v-model="query.loginAccount" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="姓名" prop="realName"><el-input v-model="query.realName" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="手机号" prop="mobile"><el-input v-model="query.mobile" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="邮箱" prop="email"><el-input v-model="query.email" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="角色" prop="roleName"><el-input v-model="query.roleName" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="部门" prop="deptName"><el-input v-model="query.deptName" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="岗位" prop="postName"><el-input v-model="query.postName" placeholder="请输入" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="query.status" placeholder="请选择" clearable>
                    <el-option label="启用" :value="1" />
                    <el-option label="停用" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item label="创建时间" prop="createdRange">
                <el-date-picker
                    v-model="createdRange"
                    type="datetimerange"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    format="YYYY-MM-DD HH:mm:ss"
                    clearable
                />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleQuery">查询</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button plain :icon="Refresh" size="small" @click="loadData">刷新</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @refresh="handleQuery" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="accountId" size="small">
            <el-table-column prop="merchantId" label="商户号" min-width="120" align="center" show-overflow-tooltip />
            <el-table-column prop="merchantName" label="商户名称" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column prop="loginAccount" label="登录账号" min-width="150" align="center" show-overflow-tooltip />
            <el-table-column prop="realName" label="姓名" min-width="110" align="center" show-overflow-tooltip />
            <el-table-column prop="mobile" label="手机号" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column prop="email" label="邮箱" min-width="170" align="center" show-overflow-tooltip />
            <el-table-column label="部门" min-width="150" align="center" show-overflow-tooltip><template #default="{ row }">{{ joinNames(row.deptNames) }}</template></el-table-column>
            <el-table-column label="岗位" min-width="150" align="center" show-overflow-tooltip><template #default="{ row }">{{ joinNames(row.postNames) }}</template></el-table-column>
            <el-table-column label="角色" min-width="180" align="center" show-overflow-tooltip><template #default="{ row }">{{ joinNames(row.roleNames) }}</template></el-table-column>
            <el-table-column label="管理员" width="90" align="center"><template #default="{ row }"><el-tag :type="row.merchantAdmin ? 'warning' : 'info'" size="small">{{ row.merchantAdmin ? '是' : '否' }}</el-tag></template></el-table-column>
            <el-table-column label="状态" width="80" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="最后登录" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.lastLoginAt" /></template></el-table-column>
            <el-table-column prop="lastLoginIp" label="登录 IP" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column label="创建时间" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.createdAt" /></template></el-table-column>
            <el-table-column label="操作" align="center" width="90" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'admin:merchant:user:detail'">详情</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog v-model="detailVisible" title="商户用户详情" width="880px" append-to-body destroy-on-close>
            <el-descriptions :column="2" border size="small" class="detail-section">
                <el-descriptions-item label="账号 ID">{{ detail?.account?.accountId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="用户 ID">{{ detail?.account?.userId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="商户号">{{ detail?.merchant?.merchantId ?? detail?.account?.merchantId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="商户名称">{{ detail?.merchant?.merchantName ?? detail?.account?.merchantName ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="登录账号">{{ detail?.account?.loginAccount ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ detail?.account?.realName ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ detail?.account?.mobile ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ detail?.account?.email ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="状态"><el-tag :type="detail?.account?.status === 1 ? 'success' : 'danger'" size="small">{{ detail?.account?.status === 1 ? '启用' : '停用' }}</el-tag></el-descriptions-item>
                <el-descriptions-item label="管理员"><el-tag :type="detail?.account?.merchantAdmin ? 'warning' : 'info'" size="small">{{ detail?.account?.merchantAdmin ? '是' : '否' }}</el-tag></el-descriptions-item>
                <el-descriptions-item label="最后登录"><BaseDateTime :value="detail?.account?.lastLoginAt" /></el-descriptions-item>
                <el-descriptions-item label="登录 IP">{{ detail?.account?.lastLoginIp ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="创建时间"><BaseDateTime :value="detail?.account?.createdAt" /></el-descriptions-item>
            </el-descriptions>

            <el-descriptions :column="1" border size="small" class="detail-section">
                <el-descriptions-item label="部门">{{ detail?.depts?.map((item) => item.deptName || item.deptCode).filter(Boolean).join('、') || '-' }}</el-descriptions-item>
                <el-descriptions-item label="岗位">{{ detail?.posts?.map((item) => item.postName || item.postCode).filter(Boolean).join('、') || '-' }}</el-descriptions-item>
                <el-descriptions-item label="角色">{{ detail?.roles?.map((item) => item.roleName || item.roleCode).filter(Boolean).join('、') || '-' }}</el-descriptions-item>
            </el-descriptions>

            <div class="detail-grid">
                <section>
                    <div class="section-title">最终菜单树</div>
                    <div v-loading="detailLoading" class="tree-wrapper">
                        <el-tree :data="detail?.menus || []" node-key="menuId" default-expand-all :props="{ label: 'menuName', children: 'children' }">
                            <template #default="{ data }">
                                <span class="tree-node">
                                    <el-tag size="small" :type="menuTagType(data.menuType)">{{ menuTypeName(data.menuType) }}</el-tag>
                                    <span>{{ data.menuName }}</span>
                                    <code v-if="data.permissionCode">{{ data.permissionCode }}</code>
                                </span>
                            </template>
                        </el-tree>
                    </div>
                </section>
                <section>
                    <div class="section-title">最终权限码</div>
                    <div class="permission-list">
                        <el-tag v-for="code in detail?.permissions || []" :key="code" size="small">{{ code }}</el-tag>
                        <el-empty v-if="!detail?.permissions?.length" description="暂无权限码" />
                    </div>
                </section>
            </div>

            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">关闭</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import { Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { getMerchantUserDetail, searchMerchantUsers, type MerchantUserDetail, type MerchantUserQuery, type MerchantUserRow } from '@/api/merchantUser';

const queryFormRef = ref<FormInstance>();
const query = reactive<MerchantUserQuery>({ pageNo: 1, pageSize: 10 });
const createdRange = ref<[string, string] | undefined>();
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const rows = ref<MerchantUserRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detail = ref<MerchantUserDetail>();

watch([page, pageSize], () => { loadData(); });
onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        const [createdStartTime, createdEndTime] = createdRange.value || [];
        const result = await searchMerchantUsers({ ...cleanQuery(query), createdStartTime, createdEndTime, pageNo: page.value, pageSize: pageSize.value });
        rows.value = result.records;
        total.value = result.total;
    } catch (error) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error instanceof Error ? error.message : '加载失败');
    } finally {
        loading.value = false;
    }
}

function handleQuery() {
    if (page.value === 1) {
        loadData();
        return;
    }
    page.value = 1;
}

function resetQuery() {
    queryFormRef.value?.resetFields();
    Object.keys(query).forEach((key) => {
        delete query[key as keyof MerchantUserQuery];
    });
    createdRange.value = undefined;
    handleQuery();
}

async function openDetail(row: MerchantUserRow) {
    detailVisible.value = true;
    detailLoading.value = true;
    detail.value = undefined;
    try {
        detail.value = await getMerchantUserDetail(row.accountId);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '加载失败');
        detailVisible.value = false;
    } finally {
        detailLoading.value = false;
    }
}

function cleanQuery(source: MerchantUserQuery) {
    const result: MerchantUserQuery = {};
    Object.entries(source).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            result[key as keyof MerchantUserQuery] = value as never;
        }
    });
    return result;
}

function joinNames(values?: string[]) {
    return values && values.length ? values.join('、') : '-';
}

function menuTypeName(type?: string) {
    const labels: Record<string, string> = { CATALOG: '目录', MENU: '菜单', BUTTON: '按钮', LINK: '外链' };
    return type ? labels[type] || type : '-';
}

function menuTagType(type?: string) {
    if (type === 'MENU') return 'success';
    if (type === 'BUTTON') return 'warning';
    if (type === 'LINK') return 'info';
    return '';
}
</script>

<style scoped>
.merchant-user-query-page :deep(.el-date-editor) {
    width: 360px;
}

.detail-section {
    margin-bottom: 12px;
}

.detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
    gap: 12px;
}

.section-title {
    margin-bottom: 8px;
    color: #303133;
    font-size: 14px;
    font-weight: 600;
}

.tree-wrapper,
.permission-list {
    min-height: 280px;
    max-height: 420px;
    overflow: auto;
    padding: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
}

.tree-node {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.tree-node code {
    color: #909399;
    font-size: 12px;
}

.permission-list {
    display: flex;
    align-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
}

@media (max-width: 900px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }
}
</style>
