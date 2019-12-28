const { features } = require('./dictionary');
const isFunction = require('../isFunction');

features.set('function', {
    factory: 1,
    name: 'function',
    fn: functionCheck
});

function functionCheck(m) {
        return function checkFn(fn) {
                if (!isFunction(fn)) {
                        return [undefined, `is not a function`];
                }
                if (m && m !== fn.length) {
                        return [undefined, `function [${fn.name || 'anonymous'}] does not have the required number of manditory arguments: ${m}`];
                }
                return [fn, undefined];

        };
}