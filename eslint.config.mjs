import js from '@eslint/js';
import globals from 'globals';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import vue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

const SOURCE_FILES = ['**/*.{js,mjs,cjs,ts,vue}'];
const TYPESCRIPT_FILES = ['**/*.{ts,vue}'];

export default tseslint.config(
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            '**/coverage/**',
            '**/.playwright-cli/**',
        ],
    },
    {
        files: ['**/*.{js,mjs,cjs,ts,vue}'],
        ...js.configs.recommended,
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    ...tseslint.configs.recommended,
    ...vue.configs['flat/essential'],
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: ['.vue'],
            },
        },
    },
    {
        files: SOURCE_FILES,
        plugins: {
            'no-unsanitized': noUnsanitized,
        },
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-script-url': 'error',
            'no-unsanitized/method': 'error',
            'no-unsanitized/property': 'error',
        },
    },
    {
        files: TYPESCRIPT_FILES,
        rules: {
            'no-undef': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'vue/multi-word-component-names': 'off',
        },
    },
    {
        files: ['**/*.vue'],
        rules: {
            'vue/no-v-html': 'error',
        },
    },
    {
        files: ['**/scripts/**/*.{js,mjs,cjs}'],
        rules: {
            'no-console': 'off',
        },
    },
    {
        // 该验证脚本必须保留脚本协议负例，以证明外链解析器会拒绝这类输入。
        files: ['**/scripts/verify-external-frame-origin.mjs'],
        rules: {
            'no-script-url': 'off',
        },
    },
    {
        // 该验证脚本仅动态导入本地源码的转译结果，不接收外部或用户输入。
        files: ['**/scripts/verify-monitor-formatters.mjs'],
        rules: {
            'no-unsanitized/method': 'off',
        },
    },
);
