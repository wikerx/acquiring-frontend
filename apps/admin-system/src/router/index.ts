import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { unwrapResult } from '@acquiring/shared';
import { currentUser } from '@/api/authApi';
import { adminModuleMetas } from '@/config/adminModules';
import AdminLayout from '@/layouts/AdminLayout.vue';
import AdminModulePage from '@/pages/AdminModulePage.vue';
import Dashboard from '@/pages/Dashboard.vue';
import Forbidden from '@/pages/Forbidden.vue';
import Login from '@/pages/Login.vue';
import OperationLogs from '@/pages/OperationLogs.vue';
import SystemConfigs from '@/pages/SystemConfigs.vue';
import SystemDicts from '@/pages/SystemDicts.vue';
import { useAuthStore } from '@/stores/authStore';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        permission?: string;
    }
}

const moduleRoutes: RouteRecordRaw[] = Object.entries(adminModuleMetas).map(([path, meta]) => ({
    path: path.replace(/^\//, ''),
    component: AdminModulePage,
    meta: {
        title: meta.title,
        permission: meta.permission,
    },
}));

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', component: Login },
        { path: '/403', component: Forbidden },
        {
            path: '/',
            component: AdminLayout,
            redirect: '/dashboard',
            children: [
                {
                    path: 'dashboard',
                    component: Dashboard,
                    meta: { title: '控制台', permission: 'admin:dashboard:view' },
                },
                {
                    path: 'system/configs',
                    component: SystemConfigs,
                    meta: { title: '参数设置', permission: 'admin:config:view' },
                },
                {
                    path: 'system/dicts',
                    component: SystemDicts,
                    meta: { title: '字典管理', permission: 'admin:dict:view' },
                },
                {
                    path: 'system/oper-logs',
                    component: OperationLogs,
                    meta: { title: '操作日志', permission: 'admin:oper-log:view' },
                },
                ...moduleRoutes,
            ],
        },
        { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
    ],
});

async function refreshCurrentUserIfNeeded() {
    const auth = useAuthStore();
    if (!auth.session || auth.hydrated) {
        return;
    }
    try {
        const response = unwrapResult((await currentUser()).data);
        auth.setCurrentUserResponse(response);
    } catch {
        auth.clearSession();
    }
}

router.beforeEach(async (to) => {
    const auth = useAuthStore();
    if (to.path !== '/login') {
        await refreshCurrentUserIfNeeded();
    }
    if (to.path !== '/login' && to.path !== '/403' && !auth.session) {
        return { path: '/login', query: { redirect: to.fullPath } };
    }
    if (to.path === '/login' && auth.session) {
        return '/dashboard';
    }
    const requiredPermission = to.meta.permission;
    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
        return '/403';
    }
    return true;
});
