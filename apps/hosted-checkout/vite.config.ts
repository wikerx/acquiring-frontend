import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

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
        proxy: {
            '/checkout': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
});
