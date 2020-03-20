'use strict';

const { objectSlice } = require('./objectSlice');
const { pathAbsorber } = require('./tokenizer');
const createIterator = require('./createIterator');

module.exports = function jxpath(path, data = undefined, ignore = undefined) {
    // data must be an object
    if (typeof path !== 'string'){
        throw new Error(`path should be a string`);
    }
    if (path.trim() === ''){
        throw new Error(`path cannot be empty or just spaces`);
    }
    const tokens = Array.from(pathAbsorber(path.trim()));
    const error = tokens.filter(f=>f.error).map(m=>m.error).join('\n|');
    if (error){
        throw new Error(error);
    }
    const iterator = createIterator(tokens);
 
    return objectSlice(data, iterator, undefined, ignore);
};