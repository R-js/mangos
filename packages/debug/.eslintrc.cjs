module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    plugins: ['prettier', '@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    rules: {
        '@typescript-eslint/no-explicit-any': 0,
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'warn', // or "error"
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }
        ]
    },
    env: {
        browser: true,
        es2021: true
    }
};
