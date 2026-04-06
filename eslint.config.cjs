const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', '**/*.js.map']
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-undef': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      'import/no-default-export': 'error'
    }
  },
  {
    files: ['**/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/application/**',
            '**/infrastructure/**',
            '@sams/*/application/**',
            '@sams/*/infrastructure/**',
            '@sams/*/src/application/**',
            '@sams/*/src/infrastructure/**'
          ]
        }
      ]
    }
  },
  {
    files: ['**/src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/infrastructure/**', '@sams/*/infrastructure/**', '@sams/*/src/infrastructure/**']
        }
      ]
    }
  },
  prettierConfig
];
