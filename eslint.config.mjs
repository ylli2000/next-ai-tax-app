import { FlatCompat } from '@eslint/eslintrc';
import pluginNext from '@next/eslint-plugin-next';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname
});

const eslintConfig = tseslint.config(
    {
        ignores: [
            // Build artifacts
            '.next/**',
            'out/**',
            'build/**',
            'dist/**',

            // Node modules
            'node_modules/**',

            // Configuration files
            '*.config.js',
            '*.config.mjs',
            'tailwind.config.js',
            'postcss.config.js',
            'next.config.js',

            // Generated files
            '*.generated.*',
            'next-env.d.ts',

            // Cache
            '.cache/**',
            '.claude/**',
            '.cursor/**'
        ]
    },
    ...compat.config({
        extends:[
        'next/core-web-vitals',
        'next/typescript',
        'prettier'
    ]}),
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        plugins: {
            '@next/next': pluginNext,
            '@typescript-eslint': typescript,
            prettier: prettierPlugin,
            import: importPlugin
        },
        settings: {
            //the Import plugin Typescript resolver 
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json'
                },
                node: true
            }
        },
        rules: {
            ...pluginNext.configs.recommended.rules,
            ...pluginNext.configs['core-web-vitals'].rules,

            // TypeScript specific rules
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['off', { argsIgnorePattern: '^_' }],

            // Prettier integration
            'prettier/prettier': ['warn', {tabWidth: 4, useTabs: false}],

            // React specific rules
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',

            // Import plugin rules
            'import/no-unresolved': 'error',
            'import/named': 'error',
            'import/default': 'error',
            'import/namespace': 'error',
            'import/no-absolute-path': 'error',
            'import/no-self-import': 'error',
            'import/no-cycle': 'error',
            'import/no-useless-path-segments': 'error',
            'import/order': ['error', {
                'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                'newlines-between': 'never'
            }],

            // General code style
            'no-console': 'warn',
            'arrow-body-style': ['error', 'as-needed'],
            'prefer-arrow-callback': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always'],
            'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true }],
            'quotes': 'off',
            'indent': ['error', 4]
        }
    },
    prettierConfig
);

export default eslintConfig;
