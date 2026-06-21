import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { VEXRA_BRAND } from '@acquiring/shared';
import App from './App.vue';
import i18n from './i18n';
import { router } from './router';
import './styles/main.css';

document.title = VEXRA_BRAND.systems.merchant.title;

createApp(App).use(createPinia()).use(router).use(i18n).use(ElementPlus).mount('#app');
