const { objectSlice } = require('./jspath/objectSlice');
const { getTokens, tokens } = require('./jspath/tokenizer');

module.exports = function jpath(path, data = undefined) {
    const tokens = getTokens(path);
    if (tokens.length === 0) {
        throw new Error(`Could not tokenize path ${path}`);
    }
    // we see . and .. as literals in pathpart
  
    if (data !== undefined){
        return objectSlice(data, tokens);
    }
    // curried version
    return function slice(_data = {}){
        return objectSlice(_data, tokens);
    }
};

