module.exports = {
    env: {
        node: true,
        es6: true,
        mocha: true
    },
    root: false,
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module'
    },
    extends: 'eslint:recommended',
    globals: {
        module: true
    },
    rules:{
        'no-constant-condition': ["error", { "checkLoops": false }]
    }
};