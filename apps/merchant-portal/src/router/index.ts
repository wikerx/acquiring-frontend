import { createRouter, createWebHistory } from 'vue-router';
import { VEXRA_BRAND } from '@acquiring/shared';
import { currentUser } from '@/api/authApi';
import { i18n } from '@/i18n';
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
                { path: 'dashboard', component: Dashboard, meta: { titleKey: 'layout.dashboard' } },
                { path: 'transactions', component: PlaceholderPage, props: { pageKey: 'transactions' }, meta: { titleKey: 'layout.transactions' } },
                { path: 'settlements', component: PlaceholderPage, props: { pageKey: 'settlements' }, meta: { titleKey: 'layout.settlements' } },
                { path: 'account', component: PlaceholderPage, props: { pageKey: 'account' }, meta: { titleKey: 'layout.account' } },
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
    const defaultTitle = VEXRA_BRAND.systems.merchant.title;
    const titleKey = to.meta.titleKey as string | undefined;
    const localizedTitle = titleKey ? i18n.global.t(titleKey) : VEXRA_BRAND.systems.merchant.subtitleEn;
    document.title =
        to.path === '/login'
            ? defaultTitle
            : `${localizedTitle} - ${VEXRA_BRAND.systems.merchant.name}`;
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
