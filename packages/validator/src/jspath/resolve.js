
'use strict';

const { tokens } = require('@mangos/jxpath/internals');

const isAbsolute = t => t.length && t[0].token === tokens.SLASH;


const lastToken = a => a[a.length - 1] || {};

function goUp(from) {
    if (from.length === 1 && from.token === tokens.SLASH) {
        return;
    }
    // protection
    while (from.length && from[from.length - 1].token === tokens.SLASH) {
        from.pop();
    }
    if (from.length > 0) {
        // stip trailing "/"
        while (lastToken(from).token === tokens.SLASH) {
            from.pop();
        }
        // strip a path name
        while (lastToken(from).token !== tokens.SLASH) {
            from.pop();
        }
        // strap the '/' 
        while (lastToken(from).token === tokens.SLASH) {
            from.pop();
        }
    }
    if (from.length === 0) {
        from.push({
            token: tokens.SLASH,
            value: '/'
        })
        return;
    }
}

function add(from, token) {
    if (from.length === 0) {
        from.push({
            token: tokens.SLASH,
            value: '/'
        });
    }
    if (from[from.length - 1].token !== tokens.SLASH) {
        from.push({
            token: tokens.SLASH,
            value: '/'
        });
    }
    from.push(token);
}


// take this out of this module at some later point
module.exports = function resolve(from, to) {
    if (isAbsolute(to)) {
        return to;
    }
    if (!isAbsolute(from)) {
        throw new TypeError(`Internal error, object location path must be absolute`);
    }
    const resolved = from.slice(); //copy
    for (const inst of to) {
        switch (inst.token) {
            case tokens.SLASH: // we dont care about this, as its just like a "space" between words
                break;
            case tokens.PARENT:
                goUp(resolved);
                break;
            case tokens.CURRENT:
                break; // skip
            default: // case tokens.PATHPART: and dynamic variants go here
                add(resolved, inst);
        }
    }
    return resolved;
}


