const { objectSlice } = require('./lib/objectSlice');
const { pathAbsorber } = require('./lib/tokenizer');
const createIterator = require('./lib/createIterator');

module.exports = function jpath(path, data = undefined) {
    if (typeof path !== 'string'){
        throw new Error(`path should be a string`);
    }
    if (path.trim() === ''){
        throw new Error(`path cannot be empty or just spaces`);
    }
    const iterator = createIterator(pathAbsorber(path.trim()));
    if (data){
        return objectSlice(data, iterator);
    }
    return function(data){
        return objectSlice(data, iterator.fork());
    }
};

