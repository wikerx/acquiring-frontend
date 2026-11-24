import { createApp, reactive, watch } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import 'element-plus/dist/index.css';
import { setupIdleLogout } from '@acquiring/shared';
import App from './App.vue';
import { router } from './router';
import { setupPermissionDirectives } from './directives/permission';
import { i18n } from './i18n';
import { APP_TITLE } from './constants/app';
import { useUserStore } from './store';
import './styles/main.css';
import '../../../packages/shared/src/styles/list-search.css';
import { isPublicAuthPath } from './utils/auth-navigation';

const app = createApp(App);
const pinia = createPinia();
const elementPlusConfig = reactive<{ locale: typeof zhCn | typeof en }>({ locale: zhCn });

watch(
    () => i18n.global.locale.value,
    (locale) => {
        elementPlusConfig.locale = locale === 'en-US' ? en : zhCn;
    },
    { immediate: true },
);

document.title = APP_TITLE;

app.use(pinia);
app.use(i18n);
setupPermissionDirectives(app);
app.use(router).use(ElementPlus, elementPlusConfig).mount('#app');

setupIdleLogout({
    readSession: () => useUserStore(pinia).authSession,
    onIdle: () => {
        const user = useUserStore(pinia);
        if (!user.authSession) {
            return;
        }
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        void user.logout().finally(() => {
            if (!isPublicAuthPath(window.location.pathname)) {
                window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            }
        });
    },
});
