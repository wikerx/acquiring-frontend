<template>
    <div class="app-container monitor-druid-page">
        <MonitorPageHeader :title="t('monitor.druid.title')" :description="t('monitor.druid.description')">
            <el-button :icon="Refresh" size="small" :loading="loading" @click="loadData">
                {{ t('common.refresh') }}
            </el-button>
        </MonitorPageHeader>

        <el-alert
            v-if="errorMessage"
            :title="errorMessage"
            type="warning"
            show-icon
            :closable="false"
            class="monitor-druid-page__notice"
        />

        <section class="druid-console-panel" aria-labelledby="druid-console-title" v-loading="loading">
            <div class="druid-console-panel__summary">
                <div class="druid-console-panel__icon" aria-hidden="true">
                    <el-icon><LinkIcon /></el-icon>
                </div>
                <div class="druid-console-panel__heading">
                    <h2 id="druid-console-title">{{ t('monitor.druid.consoleTitle') }}</h2>
                    <p>{{ t('monitor.druid.consoleDescription') }}</p>
                </div>
                <el-tag :type="statusTagType" effect="plain">{{ statusLabel }}</el-tag>
            </div>

            <el-descriptions :column="1" border size="small" class="druid-console-panel__details">
                <el-descriptions-item :label="t('monitor.druid.provider')">
                    {{ consoleAccess.provider || '-' }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('monitor.druid.consoleUrl')">
                    <span class="druid-console-panel__url">{{ consoleAccess.url || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('monitor.druid.localPoolTypes')">
                    <el-space wrap>
                        <el-tag
                            v-for="poolType in consoleAccess.localPoolTypes || []"
                            :key="poolType"
                            size="small"
                            type="info"
                            effect="plain"
                        >
                            {{ poolType }}
                        </el-tag>
                        <span v-if="!(consoleAccess.localPoolTypes || []).length">-</span>
                    </el-space>
                </el-descriptions-item>
                <el-descriptions-item :label="t('monitor.druid.configurationReason')">
                    {{ consoleAccess.reason || t('monitor.druid.noConfigurationReason') }}
                </el-descriptions-item>
            </el-descriptions>

            <div v-if="!consoleConfigured" class="druid-console-panel__configuration">
                <strong>{{ t('monitor.druid.configurationRequired') }}</strong>
                <p>{{ t('monitor.druid.configurationHint') }}</p>
                <code>acquiring.monitor.datasource-console.enabled=true</code>
                <code>acquiring.monitor.datasource-console.url=http://ip:port/druid/index.html</code>
            </div>

            <div class="druid-console-panel__actions">
                <el-button type="primary" :icon="LinkIcon" :disabled="!consoleConfigured" @click="openDruidConsole">
                    {{ t('monitor.druid.openConsole') }}
                </el-button>
                <el-button :icon="DataLine" @click="goDatasourceMonitor">
                    {{ t('monitor.druid.goDatasourceMonitor') }}
                </el-button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { DataLine, Link as LinkIcon, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { MonitorPageHeader } from '@/components/MonitorWorkbench';
import {
    getDatasourceSnapshot,
    type DataSourceMonitorConsoleAccess,
    type DataSourceMonitorResponse,
} from '@/api/monitor/datasource';
import { openExternalMenu } from '@/utils/external-menu';

/**
 * Druid 外部控制台入口页：读取 Admin 后端已校验的控制台配置并提供新窗口访问动作。
 * 页面不保存控制台地址或认证信息，确保 Nacos/环境变量仍是唯一配置来源。
 */
const { t } = useI18n();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');
const snapshot = ref<DataSourceMonitorResponse>({});
const consoleAccess = computed<DataSourceMonitorConsoleAccess>(() => snapshot.value.consoleAccess || {});
const consoleConfigured = computed(() => consoleAccess.value.status === 'CONFIGURED' && Boolean(consoleAccess.value.url));
const statusTagType = computed<'success' | 'danger' | 'info'>(() => {
    if (consoleAccess.value.status === 'CONFIGURED') {
        return 'success';
    }
    if (consoleAccess.value.status === 'MISCONFIGURED') {
        return 'danger';
    }
    return 'info';
});
const statusLabel = computed(() => {
    const labels: Record<string, string> = {
        CONFIGURED: t('monitor.datasource.consoleStatusConfigured'),
        NOT_CONFIGURED: t('monitor.datasource.consoleStatusNotConfigured'),
        MISCONFIGURED: t('monitor.datasource.consoleStatusMisconfigured'),
    };
    return labels[consoleAccess.value.status || ''] || t('monitor.datasource.consoleStatusNotConfigured');
});

onMounted(() => loadData());

/** 刷新数据源快照，只提取其中由后端校验后的 Druid 控制台访问配置。 */
async function loadData() {
    loading.value = true;
    errorMessage.value = '';
    try {
        snapshot.value = await getDatasourceSnapshot();
    } catch (error) {
        snapshot.value = {};
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        loading.value = false;
    }
}

/** 在新窗口打开后端返回的 HTTP/HTTPS Druid 控制台地址。 */
function openDruidConsole() {
    if (openExternalMenu(consoleAccess.value.url)) {
        return;
    }
    ElMessage.warning(t('monitor.datasource.druidConsoleNotConfiguredHint'));
}

/** 返回数据源监控页面查看本地 Hikari 连接池和动态数据源运行指标。 */
function goDatasourceMonitor() {
    router.push('/monitor/datasource');
}
</script>

<style scoped>
.monitor-druid-page__notice {
    margin-bottom: 16px;
}

.druid-console-panel {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 20px;
}

.druid-console-panel__summary {
    align-items: flex-start;
    display: grid;
    gap: 14px;
    grid-template-columns: 44px minmax(0, 1fr) auto;
}

.druid-console-panel__icon {
    align-items: center;
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 8px;
    color: var(--el-color-primary);
    display: flex;
    font-size: 22px;
    height: 44px;
    justify-content: center;
    width: 44px;
}

.druid-console-panel__heading {
    min-width: 0;
}

.druid-console-panel__heading h2 {
    color: var(--el-text-color-primary);
    font-size: 17px;
    line-height: 24px;
    margin: 0;
}

.druid-console-panel__heading p {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 20px;
    margin: 4px 0 0;
}

.druid-console-panel__details {
    margin-top: 20px;
}

.druid-console-panel__url {
    overflow-wrap: anywhere;
}

.druid-console-panel__configuration {
    background: var(--el-color-warning-light-9);
    border-left: 3px solid var(--el-color-warning);
    color: var(--el-text-color-regular);
    display: grid;
    gap: 6px;
    margin-top: 16px;
    padding: 12px 14px;
}

.druid-console-panel__configuration p {
    margin: 0;
}

.druid-console-panel__configuration code {
    overflow-wrap: anywhere;
}

.druid-console-panel__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 20px;
}

.druid-console-panel__actions .el-button + .el-button {
    margin-left: 0;
}

@media (max-width: 640px) {
    .druid-console-panel {
        padding: 16px;
    }

    .druid-console-panel__summary {
        grid-template-columns: 40px minmax(0, 1fr);
    }

    .druid-console-panel__summary > .el-tag {
        grid-column: 1 / -1;
        justify-self: start;
    }

    .druid-console-panel__actions {
        align-items: stretch;
        flex-direction: column;
    }

    .druid-console-panel__actions .el-button {
        width: 100%;
    }
}
</style>
