const {
    posixAbsorber,
    tdpAbsorber,
    uncAbsorber,
    ddpAbsorber,
    tokens,
    rootTokenValues,
    getCWD
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
        const rc = {};
        const iterator = inferPathType(path, options);
        const step = iterator.next(); // only get the first one (is also the most likely one)
        if (step.done) {
            return undefined;
        }
        const ns = Object.getOwnPropertyNames(step.value)[0];
        Object.assign(rc, step.value[ns]);
        rc.type = ns;
        return rc;
    }
    return path; // its not a string
}

function filterErr(t) {
    return t.error !== undefined;
}

function clonePath(path) {
    return Array.from({ length: path.length }, (v, i) => Object.assign({}, path[i]));
}

function createPathProcessor(path) {
    return function (ns, absorber) {
        const rc = {};
        const _tokens = Array.from(absorber(path));
        if (_tokens.length === 0) {
            return undefined;
        }
        rc[ns] = { path: _tokens };
        const firstError = _tokens.find(filterErr);
        if (firstError) {
            rc[ns].firstError = firstError;
        }
        return rc;
    };
}

function getErrors(path) {
    return path.filter(v => v.error).map(v => v.error).join('|');
}

function last(arr) {
    return arr[arr.length - 1];
}

function upp(path) {
    let _last;
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
    if (_from && _from.firstError) {
        throw TypeError(`"from" path contains errors: ${getErrors(_from)}`)
    }
    if (_from === undefined) {
        _from = lexPath(getCWD());
    }
    if (!(_from.path[0].token in rootTokenValues)) {
        _to.unshift(_from);
        _from = lexPath(getCWD());
    }
    let to = _to.shift()
    to = lexPath(to);
    if (to && to.firstError) {
        throw TypeError(`"to" path contains errors: ${getErrors(to)}`)
    }
    if (to === undefined) {
        return _from;
    }
    if (to.path && to.path[0].token in rootTokenValues) {
        _from = to;
        if (_to.length === 0) {
            return _from;
        }
        return resolve(to, ..._to);
    }
    // "_from" is guaranteed to me from root and "to" is guaranteed not to be from "root"
    const working = clonePath(_from.path);
    for (const token of to.path) {
        switch (token.token) {
            case tokens.SEP:
            case tokens.CURRENT:
                break;
            case tokens.PARENT:
                upp(working);
                break;
            case tokens.PATHELT:
                add(working, token);
                break;
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
    const platform = globalThis?.navigator?.platform || globalThis?.process?.platform || 'posix';
    if (platform === 'win32') {
        return '\\';
    }
    return '/';
}

function defaultOptions(options = {}) {
    if (Object.keys(options).filter(f => allNamespaces.includes(f)).length === 0) {
        const platform = globalThis?.navigator?.platform || globalThis?.process?.platform || 'posix';
        Object.assign(options, {
            unc: platform === 'win32',
            dos: platform === 'win32',
            devicePath: platform === 'win32',
            posix: platform !== 'win32'
        });
    }
    return options;
}




function* inferPathType(path, options = {}) {
    defaultOptions(options);
    const processor = createPathProcessor(path);
    const filtered = allNamespaces.filter(f => options[f])
    for (const ns of filtered) {
        const result = processor(ns, absorberMapping[ns]);
        if (result) {
            yield result;
        }
    }
    return;
}



module.exports = {
    inferPathType,
    lexPath,
    resolve
}