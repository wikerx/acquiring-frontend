import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import { setupIdleLogout, VEXRA_BRAND } from '@acquiring/shared';
import App from './App.vue';
import i18n from './i18n';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import './styles/main.css';

document.title = VEXRA_BRAND.systems.merchant.title;

const pinia = createPinia();

createApp(App).use(pinia).use(router).use(i18n).use(ElementPlus, { locale: zhCn }).mount('#app');

setupIdleLogout({
    readSession: () => useAuthStore(pinia).session,
    onIdle: () => {
        const auth = useAuthStore(pinia);
        if (!auth.session) {
            return;
        }
        auth.clearSession();
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (window.location.pathname !== '/login') {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
    },
});
