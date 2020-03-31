'use strict';

module.exports = {
    diff: true,
    bail: true,
    sort: true,
    exit: true,
    'full-trace': true,
    recursive: true,
    extension: ['test.js'],
    opts: false,
    bail: true,
    'check-leaks': true,
    package: './package.json',
    //slow: 75,
    timeout: 0,
    color: true,
    ui: 'bdd'
};
