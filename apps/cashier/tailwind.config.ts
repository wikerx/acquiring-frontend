import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{vue,ts}'],
    theme: {
        extend: {
            colors: {
                ink: '#172026',
                brand: '#0f766e',
            },
        },
    },
    plugins: [],
} satisfies Config;
