const os = require('os');

const {
    posixAbsorber,
    tdpAbsorber,
    uncAbsorber,
    ddpAbsorber,
    tokens,
    rootTokens
} = require('./tokenizer');

const absorberMapping = {
    unc: uncAbsorber,
    dos: tdpAbsorber,
    devicePath: ddpAbsorber,
    posix: posixAbsorber
}

// order of importance
const allNamespaces = ['devicePath', 'unc', 'dos', 'posix'];

function lexPath(path = '', ...args){
    if (typeof path === 'string'){
        const fr = inferPathType(path);
        const ns = allNamespaces.find( v => v in fr);
        if (!ns){
            return  [];
        }
        fr[ns].type = ns;
        return fr[ns];
    }
    return path; // its not a string
}

function filterErr(t) {
    return t.error !== undefined
}

function createPathProcessor(path) {
    return function (ns, absorber) {
        const rc = {};
        const tokens = Array.from(absorber(path));
        if (tokens.length === 0) {
            return rc;
        }
        rc[ns] = { path: tokens };
        const firstError = tokens.find(filterErr);
        if (firstError) {
            rc[ns].firstError = firstError;
        }
        return rc;
    }
}

function getErrors(path){
    return path.filter(v=>v.error).map(v=>v.error).join('|');
}

function resolve(_from, to) {
    _from = lexPath(_from, 'from');
    to = lexPath(to, 'to');
    if (_from.firstError){
        throw TypeError(`"from" path contains errors: ${getErrors(_from)}`)
    }
    if (to.firstError){
        throw TypeError(`"to" path contains errors: ${getErrors(to)}`)
    }
    if (_from.path.length === 0 && to.path.length === 0) {
        return lexPath(process.cwd());
    }
    if (to.path[0].token in rootTokens) {
        return clone(to);
    }
    // "to" argument is not root
    // if "_from" is not root then resolve it wth cwd()
    if (!(_from[0].token in rootTokens)) {
        const cwd = lexPath(process.cwd());
        _from = resolve(cwd, _from);
    }
    // "_from" is guaranteed to me from root and "to" is guaranteed not to be from "root"
    const working = clone(_from.path);
    for (token of to.path){
        switch(token.token){
            case tokens.SEP:
            case tokens.CURRENT:
                break;
            case tokens.PARENT:
                upp(working);
                break;
            case tokens.PATHELT:
                add(working, token);
            default:
        }        
    }
    // finished processing all tokens
    return { path: working };
}

function defaultOptions(options = {}){
    if (Object.keys(options).filter(f => allNamespaces.includes(f)).length === 0) {
        let platform;
        // node?
        if (typeof global !== 'undefined' && global.process && global.process.platform){
            platform = global.process.platform;
         
        } else { // browser 
            platform = 'posix';
        }
        Object.assign(options, {
            unc: platform === 'win32',
            dos: platform === 'win32',
            devicePath: platform === 'win32',
            posix: platform !== 'win32'
        });
    }
    return options;
}

function inferPathType(path, options = {}) {
    defaultOptions(options);

    const rc = {};
    const processor = createPathProcessor(path);

    for (const ns of allNamespaces) {
        const ok = options[ns];
        if (!ok) {
            continue;
        }
        const result = processor(ns, absorberMapping[ns]);
        Object.assign(rc, result);
    }
    return rc;
}



module.exports = {
    inferPathType,
    lexPath,
    resolve
}