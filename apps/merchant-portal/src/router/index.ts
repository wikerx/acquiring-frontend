import { createRouter, createWebHistory } from 'vue-router';
import { currentUser } from '@/api/authApi';
import MerchantLayout from '@/layouts/MerchantLayout.vue';
import Dashboard from '@/pages/Dashboard.vue';
import Login from '@/pages/Login.vue';
import PlaceholderPage from '@/pages/PlaceholderPage.vue';
import { useAuthStore } from '@/stores/authStore';

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', component: Login },
        {
            path: '/',
            component: MerchantLayout,
            redirect: '/dashboard',
            children: [
                { path: 'dashboard', component: Dashboard },
                { path: 'transactions', component: PlaceholderPage, props: { title: '交易查询' } },
                { path: 'settlements', component: PlaceholderPage, props: { title: '结算查询' } },
                { path: 'account', component: PlaceholderPage, props: { title: '账户信息' } },
            ],
        },
    ],
});

async function refreshCurrentUserIfNeeded() {
    const auth = useAuthStore();
    if (!auth.session || auth.hydrated) {
        return;
    }
    try {
        const response = await currentUser();
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
    if (to.path !== '/login' && !auth.session) {
        return '/login';
    }
    if (to.path === '/login' && auth.session) {
        return '/dashboard';
    }
    return true;
});
