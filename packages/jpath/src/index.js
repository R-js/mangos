const objectSlice = require('./jspath/objectSlice');
const { getTokens, tokens } = require('./jspath/tokenizer');

function toPathPart(v){
    if (v.token === tokens.PARENT || v.token === tokens.CURRENT){
        v.token = tokens.PATHPART;
    }
}


module.exports = function jpath(path, data = undefined) {
    const tokens = getTokens(path);
    if (tokens.length === 0) {
        throw new Error(`Could not tokenize path ${path}`);
    }
    // we see . and .. as literals in pathpart
    tokens.forEach(toPathPart);

    if (data !== undefined){
        return objectSlice(data, tokens);
    }
    // curried version
    return function slice(_data = {}){
        return objectSlice(_data, tokens);
    }
};

