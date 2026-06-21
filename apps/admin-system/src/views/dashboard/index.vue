<template>
    <div class="app-container dashboard-page" v-loading="loading">
        <DashboardWelcome
            :display-name="displayName"
            :today-text="todayText"
            :last-login-time="lastLoginTime"
            :last-login-ip="lastLoginIp"
        />

        <section class="dashboard-page__metrics">
            <DashboardMetricCard
                v-for="item in metricCards"
                :key="item.key"
                :icon="item.icon"
                :icon-background="item.iconBackground"
                :icon-color="item.iconColor"
                :label="item.label"
                :value="item.value"
                :hint="item.hint"
                @click="navigate(item.path)"
            />
        </section>

        <section class="dashboard-page__upper">
            <DashboardQuickAccess
                :title="$t('dashboard.quickAccessTitle')"
                :description="$t('dashboard.quickAccessDescription')"
                :items="quickAccessItems"
                @navigate="navigate"
            />
            <DashboardTrendChart
                :title="$t('dashboard.trendTitle')"
                :description="$t('dashboard.trendDescription')"
                :login-label="$t('dashboard.loginTrend')"
                :oper-label="$t('dashboard.operTrend')"
                :empty-text="$t('common.noData')"
                :active-metric="activeMetric"
                :points="trendPoints"
                @metric-change="activeMetric = $event"
            />
        </section>

        <section class="dashboard-page__lower">
            <DashboardRecentLogin
                :title="$t('dashboard.recentLoginTitle')"
                :description="$t('dashboard.recentLoginDescription')"
                :more-text="$t('dashboard.viewMore')"
                :empty-text="$t('common.noData')"
                :rows="recentLoginRows"
                @more="navigate('/system/log?tab=login')"
            />
            <DashboardRecentOperation
                :title="$t('dashboard.recentOperationTitle')"
                :description="$t('dashboard.recentOperationDescription')"
                :more-text="$t('dashboard.viewMore')"
                :empty-text="$t('common.noData')"
                :rows="recentOperationRows"
                @more="navigate('/system/log?tab=oper')"
            />
        </section>

        <DashboardMonitorEntry :items="monitorEntries" @navigate="navigate" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Component } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
    Bell,
    DataBoard,
    DataLine,
    DocumentChecked,
    Grid,
    Location,
    Lock,
    Monitor,
    Operation,
    SetUp,
    Shop,
    User,
} from '@element-plus/icons-vue';
import type { SysLoginLog } from '@/api/audit/login-log';
import { searchLoginLogs } from '@/api/audit/login-log';
import type { SysOperLog } from '@/api/audit/oper-log';
import { searchOperLogs } from '@/api/audit/oper-log';
import { getDatasourceSnapshot } from '@/api/monitor/datasource';
import type { MerchantQuery } from '@/api/merchant/info';
import { searchMerchants } from '@/api/merchant/info';
import type { SysUserAccountQuery } from '@/api/system/user';
import { searchUsers } from '@/api/system/user';
import { usePermissionStore } from '@/store/modules/permission';
import { useUserStore } from '@/store/modules/user';
import { formatDateTime } from '@/utils/format';
import DashboardMetricCard from './components/DashboardMetricCard.vue';
import DashboardMonitorEntry from './components/DashboardMonitorEntry.vue';
import DashboardQuickAccess from './components/DashboardQuickAccess.vue';
import DashboardRecentLogin from './components/DashboardRecentLogin.vue';
import type { RecentOperationRow } from './components/DashboardRecentOperation.vue';
import DashboardRecentOperation from './components/DashboardRecentOperation.vue';
import DashboardTrendChart from './components/DashboardTrendChart.vue';
import DashboardWelcome from './components/DashboardWelcome.vue';
import { dashboardMonitorMock, dashboardTrendMock } from './dashboard.mock';

type TrendMetric = 'login' | 'oper';

interface MetricCardItem {
    key: string;
    icon: Component;
    iconBackground: string;
    iconColor: string;
    label: string;
    value: string;
    hint: string;
    path: string;
}

interface QuickAccessItem {
    key: string;
    title: string;
    description: string;
    path: string;
    permission?: string;
    icon: Component;
    iconBackground: string;
    iconColor: string;
}

interface MonitorEntryItem {
    title: string;
    description: string;
    summary: string;
    path: string;
    icon: Component;
    iconBackground: string;
    iconColor: string;
}

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const permissionStore = usePermissionStore();

const loading = ref(false);
const activeMetric = ref<TrendMetric>('login');
const merchantTotal = ref(0);
const userTotal = ref(0);
const todayLoginCount = ref(0);
const todayOperCount = ref(0);
const recentLoginRows = ref<SysLoginLog[]>([]);
const recentOperationRows = ref<RecentOperationRow[]>([]);
const alertCount = ref(dashboardMonitorMock.systemAlertCount);
const resourceHealthy = ref(dashboardMonitorMock.resourceStatus === 'healthy');

const trendPoints = dashboardTrendMock;
const displayName = computed(() => userStore.userInfo?.realName || userStore.userInfo?.username || 'Admin');
const lastLoginTime = computed(() => formatDateTime(recentLoginRows.value[0]?.loginAt));
const lastLoginIp = computed(() => recentLoginRows.value[0]?.loginIp || '-');
const todayText = computed(() => {
    const now = new Date();
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long',
    }).format(now);
});

const metricCards = computed<MetricCardItem[]>(() => [
    {
        key: 'merchant',
        icon: Shop,
        iconBackground: 'rgba(37, 99, 235, 0.12)',
        iconColor: '#2563eb',
        label: t('dashboard.merchantCount'),
        value: String(merchantTotal.value),
        hint: t('dashboard.merchantCountHint'),
        path: '/merchant/info',
    },
    {
        key: 'account',
        icon: User,
        iconBackground: 'rgba(14, 165, 164, 0.12)',
        iconColor: '#0f766e',
        label: t('dashboard.accountCount'),
        value: String(userTotal.value),
        hint: t('dashboard.accountCountHint'),
        path: '/system/user',
    },
    {
        key: 'login',
        icon: Monitor,
        iconBackground: 'rgba(245, 158, 11, 0.12)',
        iconColor: '#d97706',
        label: t('dashboard.loginCount'),
        value: String(todayLoginCount.value),
        hint: t('dashboard.loginCountHint'),
        path: '/system/log?tab=login',
    },
    {
        key: 'oper',
        icon: Operation,
        iconBackground: 'rgba(239, 68, 68, 0.12)',
        iconColor: '#dc2626',
        label: t('dashboard.operCount'),
        value: String(todayOperCount.value),
        hint: t('dashboard.operCountHint'),
        path: '/system/log?tab=oper',
    },
]);

const quickAccessItems = computed(() => {
    const items: QuickAccessItem[] = [
        createQuickAccess('merchant', '/merchant/info', 'merchant:info:list', Shop, 'rgba(37, 99, 235, 0.12)', '#2563eb', t('dashboard.merchantInfo'), t('dashboard.merchantInfoDesc')),
        createQuickAccess('user', '/system/user', 'system:user:list', User, 'rgba(14, 165, 164, 0.12)', '#0f766e', t('dashboard.userManagement'), t('dashboard.userManagementDesc')),
        createQuickAccess('role', '/system/role', 'system:role:list', Lock, 'rgba(245, 158, 11, 0.12)', '#d97706', t('dashboard.roleManagement'), t('dashboard.roleManagementDesc')),
        createQuickAccess('country', '/base/country', 'base:country:list', Location, 'rgba(16, 185, 129, 0.12)', '#059669', t('dashboard.country'), t('dashboard.countryDesc')),
        createQuickAccess('dict', '/system/dict', 'system:dict:list', Grid, 'rgba(99, 102, 241, 0.12)', '#4f46e5', t('dashboard.dictManagement'), t('dashboard.dictManagementDesc')),
        createQuickAccess('config', '/system/config', 'system:config:query', SetUp, 'rgba(148, 163, 184, 0.16)', '#475569', t('dashboard.configManagement'), t('dashboard.configManagementDesc')),
        createQuickAccess('log', '/system/log', 'system:login-log:list', DocumentChecked, 'rgba(59, 130, 246, 0.12)', '#2563eb', t('dashboard.logManagement'), t('dashboard.logManagementDesc')),
        createQuickAccess('sharding', '/monitor/sharding/rules', 'monitor:sharding:rule:list', DataBoard, 'rgba(236, 72, 153, 0.12)', '#db2777', t('dashboard.shardingManagement'), t('dashboard.shardingManagementDesc')),
    ];
    return items.filter((item) => hasMenuAccess(item.path, item.permission)).slice(0, 8);
});

const monitorEntries = computed<MonitorEntryItem[]>(() => {
    const items: MonitorEntryItem[] = [
        {
            title: t('dashboard.systemAlert'),
            description: t('dashboard.systemAlertDesc'),
            summary: t('dashboard.systemAlertSummary', { count: alertCount.value }),
            path: '/monitor/datasource',
            icon: Bell,
            iconBackground: 'rgba(245, 158, 11, 0.12)',
            iconColor: '#d97706',
        },
        {
            title: t('dashboard.resourceMonitor'),
            description: t('dashboard.resourceMonitorDesc'),
            summary: resourceHealthy.value ? t('dashboard.resourceHealthy') : t('dashboard.resourceWarning'),
            path: '/monitor/server',
            icon: DataLine,
            iconBackground: 'rgba(37, 99, 235, 0.12)',
            iconColor: '#2563eb',
        },
    ];
    return items.filter((item) => hasMenuAccess(item.path));
});

onMounted(() => {
    void loadDashboard();
});

async function loadDashboard() {
    loading.value = true;
    try {
        await Promise.all([
            loadMerchantTotal(),
            loadUserTotal(),
            loadLoginSummary(),
            loadOperSummary(),
            loadDatasourceSummary(),
        ]);
    } finally {
        loading.value = false;
    }
}

async function loadMerchantTotal() {
    const request: MerchantQuery = { pageNo: 1, pageSize: 1 };
    const result = await searchMerchants(request);
    merchantTotal.value = result.total || 0;
}

async function loadUserTotal() {
    const request: SysUserAccountQuery = { pageNo: 1, pageSize: 1 };
    const result = await searchUsers(request);
    userTotal.value = result.total || 0;
}

async function loadLoginSummary() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const [todayResult, latestResult] = await Promise.all([
        searchLoginLogs({
            pageNo: 1,
            pageSize: 1,
            loginStartAt: start.toISOString(),
            loginEndAt: end.toISOString(),
        }),
        searchLoginLogs({
            pageNo: 1,
            pageSize: 5,
        }),
    ]);
    todayLoginCount.value = todayResult.total || 0;
    recentLoginRows.value = latestResult.records || [];
}

async function loadOperSummary() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const [todayResult, latestResult] = await Promise.all([
        searchOperLogs({
            pageNo: 1,
            pageSize: 1,
            operatedStartAt: start.toISOString(),
            operatedEndAt: end.toISOString(),
        }),
        searchOperLogs({
            pageNo: 1,
            pageSize: 5,
        }),
    ]);
    todayOperCount.value = todayResult.total || 0;
    recentOperationRows.value = (latestResult.records || []).map((row) => ({
        id: row.id,
        moduleName: row.moduleName,
        operatorName: row.operatorName,
        status: row.status,
        operatedAt: row.operatedAt,
        businessTypeText: resolveBusinessTypeText(row),
    }));
}

async function loadDatasourceSummary() {
    try {
        const snapshot = await getDatasourceSnapshot();
        alertCount.value = snapshot.warnings?.length || 0;
        resourceHealthy.value = (snapshot.warnings?.length || 0) === 0;
    } catch {
        alertCount.value = dashboardMonitorMock.systemAlertCount;
        resourceHealthy.value = dashboardMonitorMock.resourceStatus === 'healthy';
    }
}

function createQuickAccess(
    key: string,
    path: string,
    permission: string | undefined,
    icon: Component,
    iconBackground: string,
    iconColor: string,
    title: string,
    description: string,
): QuickAccessItem {
    return { key, path, permission, icon, iconBackground, iconColor, title, description };
}

function resolveBusinessTypeText(row: SysOperLog) {
    const mapping: Record<number, string> = {
        1: t('dashboard.operationCreate'),
        2: t('dashboard.operationUpdate'),
        3: t('dashboard.operationDelete'),
        4: t('dashboard.operationQuery'),
        5: t('dashboard.operationExport'),
        6: t('dashboard.operationAudit'),
        7: t('dashboard.operationFreeze'),
        8: t('dashboard.operationUnfreeze'),
    };
    return row.businessType ? (mapping[row.businessType] || t('dashboard.operationUnknown')) : t('dashboard.operationUnknown');
}

function hasMenuAccess(path: string, permission?: string) {
    const pathMatched = findMenuPath(permissionStore.menus, path);
    if (pathMatched) {
        return true;
    }
    if (permission) {
        return userStore.hasPermission(permission);
    }
    return false;
}

function findMenuPath(items: Array<{ path?: string; children?: Array<{ path?: string; children?: unknown[] }> }>, path: string): boolean {
    return items.some((item) => {
        if (item.path === path) {
            return true;
        }
        return Array.isArray(item.children) ? findMenuPath(item.children as Array<{ path?: string; children?: Array<{ path?: string; children?: unknown[] }> }>, path) : false;
    });
}

function navigate(path: string) {
    void router.push(path);
}
</script>

<style scoped>
.dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 22px;
    padding-bottom: 24px;
}

.dashboard-page__metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
}

.dashboard-page__upper,
.dashboard-page__lower {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 20px;
}

@media (max-width: 1280px) {
    .dashboard-page__metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-page__upper,
    .dashboard-page__lower {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .dashboard-page {
        gap: 18px;
    }

    .dashboard-page__metrics {
        grid-template-columns: 1fr;
    }
}
</style>
