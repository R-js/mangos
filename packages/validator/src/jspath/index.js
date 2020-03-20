'use strict';

const { objectSlice } = require('./objectSlice');
const createIterator = require('./createIterator');

module.exports = function jxpath(tokens, data = undefined, ignore = undefined) {
    const iterator = createIterator(tokens);
    return objectSlice(data, iterator, undefined, ignore);
};