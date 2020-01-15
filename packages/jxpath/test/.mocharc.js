'use strict';

module.exports = {
    diff: true,
    bail: true,
    sort: true,
    exit: true,
    'full-trace': true,
    recursive: true,
    extension: ['js'],
    opts: false,
    package: './package.json',
    //slow: 75,
    timeout: 0,
    ui: 'bdd',
    'watch-files': ['test/**/*.js'],
    'watch-ignore': []
};
