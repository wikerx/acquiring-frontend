import { createApp } from 'vue';
import { VEXRA_BRAND } from '@acquiring/shared';
import i18n from './i18n';
import './styles.css';

document.title = VEXRA_BRAND.systems.checkout.title;

// 链接预览不预载付款表单；付款页也不必下载未使用的链接入口。
const page = /^\/l(?:\/|$)/.test(window.location.pathname)
  ? import('./components/PaymentLinkEntry.vue')
  : import('./App.vue');

void page.then(({ default: root }) => createApp(root).use(i18n).mount('#app'));
