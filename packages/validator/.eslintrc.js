module.exports = {
    env: {
        node: true,
        es6: true,
        mocha: true
    },
    root: true,
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    extends:'eslint:recommended',
    globals: {
        module: true
    },
    rules:{
        'no-constant-condition': ["error", { "checkLoops": false }]
    }
};