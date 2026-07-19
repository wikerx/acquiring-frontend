<template>
    <div class="app-container dashboard-page" v-loading="loading">
        <DashboardWelcome
            :display-name="displayName"
            :today-text="todayText"
            :last-login-time="lastLoginTime"
            :last-login-ip="lastLoginIp"
            :notices="dashboardNotices"
            @notice-click="openNoticeDetail"
            @more-notices="navigate('/system/notice')"
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
            <div class="dashboard-page__access-stack">
                <DashboardQuickAccess
                    variant="security"
                    :title="$t('dashboard.securityFocusTitle')"
                    :description="$t('dashboard.securityFocusDescription')"
                    :items="securityAccessItems"
                    @navigate="navigate"
                />
                <DashboardQuickAccess
                    :title="$t('dashboard.quickAccessTitle')"
                    :description="$t('dashboard.quickAccessDescription')"
                    :items="quickAccessItems"
                    @navigate="navigate"
                />
            </div>
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

        <section class="dashboard-page__operations">
            <DashboardActivityFeed
                :eyebrow="$t('dashboard.activityEyebrow')"
                :title="$t('dashboard.activityTitle')"
                :description="$t('dashboard.activityDescription')"
                :login-more-text="$t('dashboard.loginAudit')"
                :operation-more-text="$t('dashboard.operationAuditEntry')"
                :empty-text="$t('common.noData')"
                :items="activityItems"
                @more-login="navigate('/system/log?tab=login')"
                @more-operation="navigate('/system/log?tab=oper')"
            />
            <DashboardMonitorEntry :items="monitorEntries" @navigate="navigate" />
        </section>

        <CommonDetailDrawer v-model:visible="noticeDetailVisible" :title="$t('system.notice.detailTitle')" size="full">
            <article v-if="activeNotice" class="dashboard-notice-detail">
                <div class="dashboard-notice-detail__type">
                    <el-tag :type="activeNotice.noticeType === '1' ? 'warning' : 'success'" size="small">
                        {{ noticeTypeText(activeNotice.noticeType) }}
                    </el-tag>
                </div>
                <h2>{{ activeNotice.noticeTitle }}</h2>
                <div class="dashboard-notice-detail__meta">
                    <span>{{ activeNotice.createBy || '-' }}</span>
                    <span><BaseDateTime :value="activeNotice.createdAt" /></span>
                </div>
                <div class="dashboard-notice-detail__content">{{ activeNotice.noticeContent || '-' }}</div>
            </article>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Component } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
    Bell,
    CircleCheckFilled,
    CircleCloseFilled,
    DataBoard,
    DataLine,
    DocumentChecked,
    Grid,
    Key,
    Location,
    Lock,
    Monitor,
    Operation,
    SetUp,
    Shop,
    User,
    WarnTriangleFilled,
} from '@element-plus/icons-vue';
import type { SysLoginLog } from '@/api/audit/login-log';
import { searchLoginLogs } from '@/api/audit/login-log';
import type { SysOperLog } from '@/api/audit/oper-log';
import { searchOperLogs } from '@/api/audit/oper-log';
import { getDatasourceSnapshot } from '@/api/monitor/datasource';
import type { MerchantQuery } from '@/api/merchant/info';
import { searchMerchants } from '@/api/merchant/info';
import type { SysNotice } from '@/api/system/notice';
import { getNotice, listLatestNotices } from '@/api/system/notice';
import type { SysUserAccountQuery } from '@/api/system/user';
import { searchUsers } from '@/api/system/user';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import { usePermissionStore } from '@/store/modules/permission';
import { useUserStore } from '@/store/modules/user';
import { formatDateTime } from '@/utils/format';
import DashboardActivityFeed from './components/DashboardActivityFeed.vue';
import type { DashboardActivityItem } from './components/DashboardActivityFeed.vue';
import DashboardMetricCard from './components/DashboardMetricCard.vue';
import DashboardMonitorEntry from './components/DashboardMonitorEntry.vue';
import DashboardQuickAccess from './components/DashboardQuickAccess.vue';
import type { RecentOperationRow } from './components/DashboardRecentOperation.vue';
import DashboardTrendChart from './components/DashboardTrendChart.vue';
import DashboardWelcome from './components/DashboardWelcome.vue';
import type { DashboardNoticeItem } from './components/DashboardWelcome.vue';
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
    requirePermission?: boolean;
    icon: Component;
    iconBackground: string;
    iconColor: string;
}

interface MonitorEntryItem {
    title: string;
    description: string;
    summary: string;
    path: string;
    permission?: string;
    requirePermission?: boolean;
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
const latestNotices = ref<SysNotice[]>([]);
const activeNotice = ref<SysNotice | null>(null);
const noticeDetailVisible = ref(false);

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
const dashboardNotices = computed<DashboardNoticeItem[]>(() => latestNotices.value.map((notice) => ({
    id: Number(notice.id),
    title: notice.noticeTitle,
    typeText: noticeTypeText(notice.noticeType),
    createdAtText: formatDateTime(notice.createdAt),
})));

const activityItems = computed<DashboardActivityItem[]>(() => {
    const loginItems = recentLoginRows.value.map((row) => ({
        id: `login-${row.id}`,
        title: row.loginStatus === 1 ? t('dashboard.activityLoginSuccess') : t('dashboard.activityLoginFailed'),
        description: row.failReason || t('dashboard.activityLoginDescription', { account: row.loginAccount || '-' }),
        actor: row.loginAccount || '-',
        source: row.loginIp || '-',
        statusText: row.loginStatus === 1 ? t('status.success') : t('status.failed'),
        time: row.loginAt,
        tone: row.loginStatus === 1 ? 'success' as const : 'danger' as const,
        icon: row.loginStatus === 1 ? CircleCheckFilled : CircleCloseFilled,
    }));
    const operationItems = recentOperationRows.value.map((row) => ({
        id: `operation-${row.id}`,
        title: row.moduleName || t('dashboard.operationUnknown'),
        description: `${row.operatorName || '-'} · ${row.businessTypeText}`,
        actor: row.operatorName || '-',
        source: t('dashboard.activityOperationSource'),
        statusText: row.status === 1 ? t('status.success') : t('status.failed'),
        time: row.operatedAt,
        tone: row.status === 1 ? operationTone(row.businessTypeText) : 'danger' as const,
        icon: row.status === 1 ? DocumentChecked : WarnTriangleFilled,
    }));
    return [...loginItems, ...operationItems]
        .sort((left, right) => timestamp(right.time) - timestamp(left.time))
        .slice(0, 8);
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
        createQuickAccess('sharding', '/monitor/sharding/rules', 'monitor:sharding:rule:list', DataBoard, 'rgba(236, 72, 153, 0.12)', '#db2777', t('dashboard.shardingManagement'), t('dashboard.shardingManagementDesc')),
        createQuickAccess('country', '/base/country', 'base:country:list', Location, 'rgba(16, 185, 129, 0.12)', '#059669', t('dashboard.country'), t('dashboard.countryDesc')),
        createQuickAccess('dict', '/system/dict', 'system:dict:list', Grid, 'rgba(99, 102, 241, 0.12)', '#4f46e5', t('dashboard.dictManagement'), t('dashboard.dictManagementDesc')),
        createQuickAccess('config', '/system/config', 'system:config:query', SetUp, 'rgba(148, 163, 184, 0.16)', '#475569', t('dashboard.configManagement'), t('dashboard.configManagementDesc')),
    ];
    return items.filter(canShowQuickAccess).slice(0, 8);
});

const securityAccessItems = computed(() => {
    const items: QuickAccessItem[] = [
        createQuickAccess('mfaSecurity', '/system/user', 'sys:user:mfa:view', Key, 'rgba(15, 23, 42, 0.08)', '#0f172a', t('dashboard.mfaSecurity'), t('dashboard.mfaSecurityDesc'), true),
        createQuickAccess('securityIntercept', '/monitor/security-intercept-event', 'security:intercept-event:list', WarnTriangleFilled, 'rgba(220, 38, 38, 0.1)', '#dc2626', t('dashboard.securityIntercept'), t('dashboard.securityInterceptDesc')),
        createQuickAccess('loginAudit', '/system/log?tab=login', 'system:login-log:list', Monitor, 'rgba(59, 130, 246, 0.12)', '#2563eb', t('dashboard.loginAudit'), t('dashboard.loginAuditDesc')),
        createQuickAccess('operationAudit', '/system/log?tab=oper', 'system:oper-log:list', DocumentChecked, 'rgba(124, 58, 237, 0.1)', '#7c3aed', t('dashboard.operationAuditEntry'), t('dashboard.operationAuditEntryDesc')),
    ];
    return items.filter(canShowQuickAccess);
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
            title: t('dashboard.securityIntercept'),
            description: t('dashboard.securityInterceptMonitorDesc'),
            summary: t('dashboard.securityInterceptSummary'),
            path: '/monitor/security-intercept-event',
            permission: 'security:intercept-event:list',
            icon: WarnTriangleFilled,
            iconBackground: 'rgba(220, 38, 38, 0.1)',
            iconColor: '#dc2626',
        },
        {
            title: t('dashboard.mfaProtection'),
            description: t('dashboard.mfaProtectionDesc'),
            summary: t('dashboard.mfaProtectionSummary'),
            path: '/system/user',
            permission: 'sys:user:mfa:view',
            requirePermission: true,
            icon: Key,
            iconBackground: 'rgba(15, 23, 42, 0.08)',
            iconColor: '#0f172a',
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
    return items.filter(canShowMonitorEntry);
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
            loadLatestNotices(),
        ]);
    } finally {
        loading.value = false;
    }
}

async function loadLatestNotices() {
    try {
        latestNotices.value = await listLatestNotices(3);
    } catch {
        latestNotices.value = [];
    }
}

async function openNoticeDetail(item: DashboardNoticeItem) {
    activeNotice.value = await getNotice(item.id);
    noticeDetailVisible.value = true;
}

function noticeTypeText(type?: string) {
    return type === '1' ? t('system.notice.typeNotice') : t('system.notice.typeAnnouncement');
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
    requirePermission = false,
): QuickAccessItem {
    return { key, path, permission, requirePermission, icon, iconBackground, iconColor, title, description };
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

function operationTone(text: string) {
    if ([t('dashboard.operationDelete'), t('dashboard.operationFreeze'), t('dashboard.operationAudit')].includes(text)) {
        return 'warning' as const;
    }
    return 'info' as const;
}

function timestamp(value?: string) {
    return value ? new Date(value).getTime() || 0 : 0;
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

function canShowQuickAccess(item: QuickAccessItem) {
    if (item.requirePermission && item.permission) {
        return userStore.hasPermission(item.permission);
    }
    return hasMenuAccess(item.path, item.permission);
}

function canShowMonitorEntry(item: MonitorEntryItem) {
    if (item.requirePermission && item.permission) {
        return userStore.hasPermission(item.permission);
    }
    return hasMenuAccess(item.path, item.permission);
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

.dashboard-page__upper {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 20px;
}

.dashboard-page__operations {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
    gap: 20px;
}

.dashboard-page__access-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
}

.dashboard-notice-detail {
    max-width: 760px;
    margin: 0 auto;
    padding: 8px 0 24px;
}

.dashboard-notice-detail__type {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
}

.dashboard-notice-detail h2 {
    margin: 0;
    color: #0f172a;
    font-size: 22px;
    line-height: 1.35;
    text-align: center;
}

.dashboard-notice-detail__meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 18px;
    margin-top: 16px;
    padding-bottom: 18px;
    border-bottom: 1px solid #edf1f7;
    color: #64748b;
    font-size: 13px;
}

.dashboard-notice-detail__content {
    min-height: 260px;
    margin-top: 26px;
    padding: 28px 32px;
    border: 1px solid #edf1f7;
    border-radius: 8px;
    background: #fff;
    color: #1f2937;
    font-size: 14px;
    line-height: 1.9;
    white-space: pre-wrap;
    word-break: break-word;
}

@media (max-width: 1280px) {
    .dashboard-page__metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-page__upper,
    .dashboard-page__operations {
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
