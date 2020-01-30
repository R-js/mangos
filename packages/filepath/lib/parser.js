
const clone = require('clone');

const {
    posixAbsorber,
    tdpAbsorber,
    uncAbsorber,
    ddpAbsorber,
    tokens,
    rootTokens,
    rootTokenValues
} = require('./tokenizer');

const absorberMapping = {
    unc: uncAbsorber,
    dos: tdpAbsorber,
    devicePath: ddpAbsorber,
    posix: posixAbsorber
}

// order of importance
const allNamespaces = ['devicePath', 'unc', 'dos', 'posix'];

function lexPath(path = '', options = {}) {
    if (typeof path === 'string') {
        const fr = inferPathType(path, options);
        const ns = allNamespaces.find(v => v in fr);
        if (!ns) {
            return { path: [] };
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

function getErrors(path) {
    return path.filter(v => v.error).map(v => v.error).join('|');
}

function last(arr) {
    return arr[arr.length - 1];
}

function upp(path) {
    for (_last = last(path); _last.token === tokens.SEP; _last = last(path)) {
        path.pop();
    }
    // there is a root?
    if (!(_last.token in rootTokenValues)) {
        path.pop();
    }
}

function add(_tokens, token) {
    if (token.token === tokens.SEP) {
        return; // skip this
    }
    let _last = last(_tokens);
    // normalize
    for (; _last === tokens.SEP; _last = last(_tokens).token) {
        tokens.pop();
    }
    _tokens.push({
        token: tokens.SEP,
        start: _last.end + 1,
        end: _last.end + 1,
        value: getSeperator()
    });
    _tokens.push({
        token: token.token,
        start: _last.end + 2,
        end: _last.end + +2 + token.end,
        value: token.value
    });
}

function resolve(_from, ..._to) {
    _from = lexPath(_from);
    if (_from.firstError) {
        throw TypeError(`"from" path contains errors: ${getErrors(_from)}`)
    }
    let to = _to.shift()
    to = lexPath(to);
    if (to.firstError) {
        throw TypeError(`"to" path contains errors: ${getErrors(to)}`)
    }
    if (_from.path && _from.path.length === 0 && to.path && to.path.length === 0) {
        return lexPath(process.cwd());
    }
    if (to.path && to.path[0].token in rootTokenValues) {
        if (_to.length === 0) {
            return clone(to);
        }
        return resolve(to, ..._to);
    }
    // "to" argument is not root
    // if "_from" is not root then resolve it wth cwd()
    if (!(_from.path && _from.path[0].token in rootTokenValues)) {
        const cwd = lexPath(getCWD());
        _from = resolve(cwd, _from);
    }
    // "_from" is guaranteed to me from root and "to" is guaranteed not to be from "root"
    const working = clone(_from.path);
    for (token of to.path) {
        switch (token.token) {
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
    const rc = { path: working, type: _from.type };
    if (_to.length === 0) { // efficiency+
        return rc;
    }
    return resolve(rc, ..._to)
}

function getSeperator() {
    if (typeof global !== 'undefined' && global.process && global.process.platform) {
        if (global.process.platform === 'win32') {
            return '\\';
        }
    }
    return '/';
}

function defaultOptions(options = {}) {
    if (Object.keys(options).filter(f => allNamespaces.includes(f)).length === 0) {
        let platform;
        // node?
        if (typeof global !== 'undefined' && global.process && global.process.platform) {
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

function getCWD() {
    if (typeof global !== 'undefined' && global.process && global.process.cwd && typeof global.process.cwd === 'function') {
        return global.process.cwd();
    }
    if (typeof window !== 'undefined' && window.location && window.location.pathname) {
        return window.location.pathname;
    }
    return '/'
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