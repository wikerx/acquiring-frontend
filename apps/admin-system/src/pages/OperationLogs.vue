<template>
    <section class="page">
        <div class="page-header">
            <div>
                <span class="eyebrow">Audit</span>
                <h1>操作日志</h1>
            </div>
            <el-button @click="loadLogs">刷新</el-button>
        </div>

        <el-form :model="query" class="search-panel" inline>
            <el-form-item label="模块">
                <el-input v-model.trim="query.moduleName" clearable placeholder="请输入模块名称" />
            </el-form-item>
            <el-form-item label="操作人ID">
                <el-input v-model.trim="query.operatorId" clearable placeholder="请输入操作人ID" />
            </el-form-item>
            <el-form-item label="商户号">
                <el-input v-model.trim="query.merchantId" clearable placeholder="请输入商户号" />
            </el-form-item>
            <el-form-item label="业务类型">
                <el-select v-model="query.businessType" clearable placeholder="全部" style="width: 130px">
                    <el-option label="新增" :value="1" />
                    <el-option label="修改" :value="2" />
                    <el-option label="删除" :value="3" />
                    <el-option label="查询" :value="4" />
                    <el-option label="导出" :value="5" />
                    <el-option label="审核" :value="6" />
                    <el-option label="冻结" :value="7" />
                    <el-option label="解冻" :value="8" />
                </el-select>
            </el-form-item>
            <el-form-item label="状态">
                <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
                    <el-option label="成功" :value="1" />
                    <el-option label="失败" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item label="操作时间">
                <el-date-picker
                    v-model="operatedRange"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                />
            </el-form-item>
            <el-form-item>
                <el-button @click="resetQuery">重置</el-button>
                <el-button type="primary" @click="loadLogs">搜索</el-button>
            </el-form-item>
        </el-form>

        <el-table :data="rows" border stripe v-loading="loading" empty-text="暂无操作日志">
            <el-table-column prop="operatedAt" label="操作时间" width="180">
                <template #default="{ row }">{{ formatDateTime(row.operatedAt) }}</template>
            </el-table-column>
            <el-table-column prop="moduleName" label="模块" width="140" />
            <el-table-column prop="businessType" label="业务类型" width="100">
                <template #default="{ row }">{{ businessTypeLabel(row.businessType) }}</template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="140" />
            <el-table-column prop="merchantId" label="商户号" width="140" show-overflow-tooltip />
            <el-table-column prop="requestMethod" label="方法" width="90" />
            <el-table-column prop="operUrl" label="请求地址" min-width="220" show-overflow-tooltip />
            <el-table-column prop="costTime" label="耗时(ms)" width="110" align="right" />
            <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                        {{ row.status === 1 ? '成功' : '失败' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="详情" width="90" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" @click="openDetail(row)">查看</el-button>
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
                @size-change="loadLogs"
                @current-change="loadLogs"
            />
        </div>

        <el-dialog v-model="detailVisible" title="操作日志详情" width="900px">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="Trace ID">{{ selectedLog?.traceId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Request ID">{{ selectedLog?.requestId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="操作人ID">{{ selectedLog?.operatorId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="操作人">{{ selectedLog?.operatorName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="操作 IP">{{ selectedLog?.operIp || '-' }}</el-descriptions-item>
                <el-descriptions-item label="错误码">{{ selectedLog?.errorCode || '-' }}</el-descriptions-item>
                <el-descriptions-item label="错误信息" :span="2">
                    {{ selectedLog?.errorMsg || '-' }}
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </section>
</template>

<script setup lang="ts">
    import { onMounted, reactive, ref } from 'vue';
    import { ElMessage } from 'element-plus';
    import { formatDateTime, unwrapResult } from '@acquiring/shared';
    import { searchOperLogs, type OperLogQuery, type SysOperLog } from '@/api/operLogApi';

    const rows = ref<SysOperLog[]>([]);
    const total = ref(0);
    const loading = ref(false);
    const detailVisible = ref(false);
    const selectedLog = ref<SysOperLog>();
    const operatedRange = ref<[string, string]>();
    const query = reactive<OperLogQuery>({ pageNo: 1, pageSize: 20 });

    onMounted(loadLogs);

    async function loadLogs() {
        loading.value = true;
        try {
            const page = unwrapResult((await searchOperLogs(buildQuery())).data);
            rows.value = page.records || [];
            total.value = Number(page.total || 0);
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '操作日志加载失败');
        } finally {
            loading.value = false;
        }
    }

    function buildQuery(): OperLogQuery {
        return {
            ...query,
            operatedStartAt: operatedRange.value?.[0],
            operatedEndAt: operatedRange.value?.[1],
        };
    }

    function resetQuery() {
        const pageSize = query.pageSize;
        operatedRange.value = undefined;
        Object.keys(query).forEach((key) => delete query[key as keyof OperLogQuery]);
        Object.assign(query, { pageNo: 1, pageSize });
        loadLogs();
    }

    function openDetail(row: SysOperLog) {
        selectedLog.value = row;
        detailVisible.value = true;
    }

    function businessTypeLabel(value?: number) {
        return (
            {
                1: '新增',
                2: '修改',
                3: '删除',
                4: '查询',
                5: '导出',
                6: '审核',
                7: '冻结',
                8: '解冻',
            } as Record<number, string>
        )[value || 0] || '-';
    }
</script>
