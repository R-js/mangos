const { objectSlice } = require('./lib/objectSlice');
const { pathAbsorber } = require('./lib/tokenizer');
const createIterator = require('./lib/createIterator');

module.exports = function jxpath(path, data = undefined, ignore = undefined) {
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
    // if there are errors in iterator
    if (data){
        return objectSlice(data, iterator, ignore);
    }
    return function(data, ignore2){
        return objectSlice(data, iterator.fork(), ignore2);
    }
};

