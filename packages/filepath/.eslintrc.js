module.exports = {
    env: {
        node: true,
        es6: true,
        mocha: true,
        dom: true
    },
    root: true,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    extends:'eslint:recommended',
    globals: {
        module: true
    }
};