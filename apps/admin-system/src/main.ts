import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import { setupIdleLogout } from '@acquiring/shared';
import App from './App.vue';
import { router } from './router';
import { setupPermissionDirectives } from './directives/permission';
import { i18n } from './i18n';
import { APP_TITLE } from './constants/app';
import { useUserStore } from './store';
import './styles/main.css';

const app = createApp(App);
const pinia = createPinia();

document.title = APP_TITLE;

app.use(pinia);
app.use(i18n);
setupPermissionDirectives(app);
app.use(router).use(ElementPlus, { locale: zhCn }).mount('#app');

setupIdleLogout({
    readSession: () => useUserStore(pinia).authSession,
    onIdle: () => {
        const user = useUserStore(pinia);
        if (!user.authSession) {
            return;
        }
        user.reset();
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (window.location.pathname !== '/login') {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
    },
});
