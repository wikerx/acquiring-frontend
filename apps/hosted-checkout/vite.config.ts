import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const allowedHosts = (process.env.CHECKOUT_ALLOWED_HOSTS || '96f5157.r11.vip.cpolar.cn')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@acquiring/shared': fileURLToPath(
                new URL('../../packages/shared/src/index.ts', import.meta.url),
            ),
        },
    },
    server: {
        allowedHosts,
        proxy: {
            '/checkout/api': {
                target: process.env.CHECKOUT_API_PROXY_TARGET || 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
            '/checkout/config': {
                target: process.env.CHECKOUT_API_PROXY_TARGET || 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
});
