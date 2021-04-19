module.exports = {
    env: {
        node: true,
        es6: true,
        mocha: true
    },
    root: true,
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    extends:'eslint:recommended',
    globals: {
        module: true
    }
};