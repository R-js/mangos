const { inferPathType, lexPath, resolve } = require('./lib/parser');
const { tokens, rootTokens } = require('./lib/tokenizer');

function invertObject(o) {
    const rc = {};
    Object.entries(o).reduce((c, [key,value]) => {
        c[value] = key;
        return c;
    }, rc);
    return rc;
}

module.exports = {
    inferPathType,
    lexPath,
    resolve,
    $tokens: {
        root: rootTokens,
        rootValues: invertObject(rootTokens),
        other: tokens,
        values: invertObject(tokens)
    }
};
