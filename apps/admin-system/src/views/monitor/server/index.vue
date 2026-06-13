<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('monitor.server.title') }}</h1>

            </div>
            <el-button :icon="Refresh" size="small" @click="loadData">{{ $t('common.refresh') }}</el-button>
        </div>

        <el-row :gutter="16" v-loading="loading">
            <el-col :span="8" v-for="card in cards" :key="card.title" style="margin-bottom:16px">
                <el-card shadow="never">
                    <template #header><span style="font-weight:600">{{ card.title }}</span></template>
                    <div v-for="item in card.items" :key="item.label" style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #f5f7fa">
                        <span style="color:#909399">{{ item.label }}</span>
                        <span>{{ item.value }}</span>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Refresh } from '@element-plus/icons-vue';
import { getServerInfo, type ServerInfo } from '@/api/monitor/server';

const { t } = useI18n();
const loading = ref(false);

interface Card { title: string; items: Array<{ label: string; value: string }> }

const cards = ref<Card[]>([
    { title: t('monitor.server.cpu'), items: [] },
    { title: t('monitor.server.memory'), items: [] },
    { title: t('monitor.server.serverInfo'), items: [] },
    { title: t('monitor.server.jvm'), items: [] },
    { title: t('monitor.server.disk'), items: [] },
    { title: t('monitor.server.runtime'), items: [] },
]);

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    try {
        const info: ServerInfo = await getServerInfo();
        cards.value = buildCards(info);
    } catch {
        // keep placeholder
    } finally {
        loading.value = false;
    }
}

function buildCards(info: ServerInfo): Card[] {
    const cpu = info.cpu || {};
    const jvm = info.jvm || {};
    const sys = info.system || {};
    const run = info.runtime || {};
    const disk = info.disk || {};
    return [
        { title: t('monitor.server.cpu'), items: [
            { label: t('monitor.server.cores'), value: String(cpu.availableProcessors || '-') },
            { label: t('monitor.server.systemLoad'), value: String(cpu.systemLoadAverage ?? '-') },
            { label: t('monitor.server.arch'), value: String(cpu.arch || '-') },
            { label: t('monitor.server.name'), value: String(cpu.name || '-') },
        ]},
        { title: t('monitor.server.memory'), items: [
            { label: t('monitor.server.maxMemory'), value: String(jvm.max || '-') },
            { label: t('monitor.server.allocated'), value: String(jvm.total || '-') },
            { label: t('monitor.server.free'), value: String(jvm.free || '-') },
            { label: t('monitor.server.used'), value: String(jvm.used || '-') },
        ]},
        { title: t('monitor.server.serverInfo'), items: [
            { label: t('monitor.server.osName'), value: String(sys.osName || '-') },
            { label: t('monitor.server.osArch'), value: String(sys.osArch || '-') },
            { label: t('monitor.server.userName'), value: String(sys.userName || '-') },
        ]},
        { title: t('monitor.server.jvm'), items: [
            { label: t('monitor.server.javaVersion'), value: String(jvm.javaVersion || '-') },
            { label: t('monitor.server.jvmMaxMem'), value: String(jvm.max || '-') },
            { label: t('monitor.server.jvmFree'), value: String(jvm.free || '-') },
            { label: t('monitor.server.jvmUsed'), value: String(jvm.used || '-') },
        ]},
        { title: t('monitor.server.disk'), items: [
            { label: t('monitor.server.diskPath'), value: String(disk.path || '-') },
            { label: t('monitor.server.diskTotal'), value: String(disk.total || '-') },
            { label: t('monitor.server.diskFree'), value: String(disk.free || '-') },
            { label: t('monitor.server.diskUsed'), value: String(disk.used || '-') },
            { label: t('monitor.server.diskUsage'), value: String(disk.usagePercent || '-') },
        ]},
        { title: t('monitor.server.runtime'), items: [
            { label: t('monitor.server.uptime'), value: String(run.uptime || '-') },
            { label: t('monitor.server.javaVersion'), value: String(jvm.javaVersion || '-') },
        ]},
    ];
}
</script>
