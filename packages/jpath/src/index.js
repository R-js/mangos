const objectSlice = require('./jspath/objectSlice');
const { getTokens } = require('./jspath/tokenizer');

module.exports = function jpath(path, data = undefined) {
    const tokens = getTokens(path);
    if (tokens.length === 0) {
        throw new Error(`Could not tokenize path ${path}`);
    }
    if (data !== undefined){
        return objectSlice(data, tokens);
    }
    // curried version
    return function slice(data){
        return objectSlice(data, tokens);
    }
};

