const {
    pathAbsorber,
    tokens
} = require('../src/lib/tokenizer');

const createIterator = require('../src/lib/createIterator');
const objectSlice = require('../src/lib/objectSlice');


function jxpathUseTokens(tokens, data = undefined, ignore = undefined) {
    const error = tokens.filter(f=>f.error).map(m=>m.error).join('\n|');
    if (error){
        throw new Error(error);
    }
    const iterator = createIterator(tokens);
    // if there are errors in iterator
    if (data){
        return objectSlice(data, iterator, undefined, ignore);
    }
    return function(data, ignore2){
        return objectSlice(data, iterator.fork(), undefined , ignore2);
    }
};

module.exports = {
    pathAbsorber, tokens, jxpathUseTokens
};

