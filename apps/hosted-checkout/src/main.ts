import { createApp } from 'vue';
import { VEXRA_BRAND } from '@acquiring/shared';
import App from './App.vue';
import PaymentLinkEntry from './components/PaymentLinkEntry.vue';
import i18n from './i18n';
import './styles.css';

document.title = VEXRA_BRAND.systems.checkout.title;

createApp(/^\/l(?:\/|$)/.test(window.location.pathname) ? PaymentLinkEntry : App).use(i18n).mount('#app');
