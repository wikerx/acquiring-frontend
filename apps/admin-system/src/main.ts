import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import App from './App.vue';
import { router } from './router';
import { setupPermissionDirectives } from './directives/permission';
import { i18n } from './i18n';
import { APP_TITLE } from './constants/app';
import './styles/main.css';

const app = createApp(App);

document.title = APP_TITLE;

app.use(createPinia());
app.use(i18n);
setupPermissionDirectives(app);
app.use(router).use(ElementPlus, { locale: zhCn }).mount('#app');
