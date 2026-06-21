import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{vue,ts}'],
    theme: {
        extend: {
            colors: {
                ink: '#172026',
                brand: '#7c3aed',
            },
        },
    },
    plugins: [],
} satisfies Config;
