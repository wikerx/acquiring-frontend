import { createApp } from 'vue';
import { getSystemBrand, VEXRA_PRODUCT_BRANDS } from '@acquiring/shared';
import i18n from './i18n';
import './styles.css';

const isPaymentLink = /^\/l(?:\/|$)/.test(window.location.pathname);
const linkBrand = VEXRA_PRODUCT_BRANDS.link;
document.title = isPaymentLink ? linkBrand.name : getSystemBrand('checkout').title;

if (isPaymentLink) {
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.href = linkBrand.favicon;
    favicon.type = 'image/png';
    favicon.sizes.value = '32x32';
  }
}

// 链接预览不预载付款表单；付款页也不必下载未使用的链接入口。
const page = isPaymentLink
  ? import('./components/PaymentLinkEntry.vue')
  : import('./App.vue');

void page.then(({ default: root }) => createApp(root).use(i18n).mount('#app'));
