<template>
    <div class="app-container">
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Refresh" size="small" @click="loadData" v-hasPermi="'monitor:sharding:idRule:query'">
                    {{ $t('common.refresh') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @refresh="loadData" />
            </el-col>
        </el-row>

        <el-card shadow="never" v-loading="loading">
            <el-descriptions :column="2" border size="small">
                <el-descriptions-item :label="$t('monitor.sharding.idMode')">{{ data.mode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.prefixFormat')">{{ data.prefixFormat || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.sequenceWidth')">{{ data.sequenceWidth ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.startSequence')">{{ data.startSequence ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.maxSequence')">{{ data.maxSequence ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.currentQuarter')">{{ data.currentQuarter || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.currentQuarterStartValue')">{{ data.currentQuarterStartValue ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.currentQuarterMaxValue')">{{ data.currentQuarterMaxValue ?? '-' }}</el-descriptions-item>
            </el-descriptions>
            <el-alert
                type="info"
                show-icon
                :closable="false"
                :title="$t('monitor.sharding.idRuleHint')"
                style="margin-top: 16px"
            />
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { getShardingIdRule, type ShardingIdRule } from '@/api/monitor/sharding';

const { t } = useI18n();
const loading = ref(false);
const data = ref<ShardingIdRule>({});

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    try {
        data.value = await getShardingIdRule();
    } catch (error) {
        console.error(error);
        data.value = {};
        ElMessage.error(t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}
</script>
