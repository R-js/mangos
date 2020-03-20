'use strict';

const tokens = Object.freeze({
    PATHPART: '\x01',
    SLASH: '\x0f',
    PARENT: '\x03',
    CURRENT: '\x04',
    PREDICATE_ELT_REGEXP: '\0x07',
    PREDICATE_ELT_LITERAL: '\0x08',
    EQUAL_TOKEN: '\0x09',
    BRACKET_OPEN: '\0x0a',
    BRACKET_CLOSE: '\0x0b',
    RECURSIVE_DESCENT: '\u000c'
});

const { max } = Math;

function regExpSafe(exp, flags) {
    try {
        return new RegExp(exp, flags);
    }
    catch (err) {
        return undefined;
    }
}

function* predicateRegExpAbsorber(str = '', start = 0, end = str.length - 1) {
    if (str[start] !== '/') {
        return undefined;
    }
    // slowly absorb untill you have found another '/' without escape '\\'
    let i = start + 1
    while (i <= end) {
        if (str[i] === '/' && str[i - 1] !== '\\') {
            // check for regexp flags after the "/" token
            let j = i+1;
            while ('igmsuy'.includes(str[j])){
                j++;
            }
            j--;
            let flags;
            if (j >= i+1){
                flags = str.slice(i+1, j+1);
            }
            const exp = str.slice(start + 1, i);
            const value = regExpSafe(exp, flags);
            if (value) {
                yield {
                    start,
                    end: i,
                    value,
                    token: tokens.PREDICATE_ELT_REGEXP
                }
            }
            else {
                yield {
                    error: 'invalid regexp expression',
                    start,
                    end: i,
                    value: str.slice(start, i + 1),
                    token: tokens.PREDICATE_ELT_REGEXP
                }
            }
            return;
        }
        i++;
    }
    // not good, invalid regexp for sure 
    yield {
        error: 'invalid regexp expression, could not find ending "/"',
        start,
        end,
        value: str.slice(start, end + 1),
        token: tokens.PREDICATE_ELT_REGEXP
    }
}

const noLValue = {
    error: 'no L value at all',
    token: tokens.PREDICATE_ELT_LITERAL,
}

function* absorbLExpPredicate(str = '', start = 0, end = str.length - 1) {
    // just absorb till you find an = without escaped with \\
    let i = start;
    if (start >= end) {
        yield noLValue;
        return;
    }
    while (i <= end) {
        if (str[i] === '=' && str[i - 1] !== '\\') {
            if (i === start) {
                yield noLValue;
                return;
            }
            yield {
                value: str.slice(start, i),
                start: start,
                end: max(start, i - 1),
                token: tokens.PREDICATE_ELT_LITERAL,
            };
            break;
        }
        i++;
    }
    // not good
    if (i > end) {
        yield {
            error: 'invalid L-exp literal predicate, no following "=" found',
            value: str.slice(start, end + 1),
            start: start,
            end,
            token: tokens.PREDICATE_ELT_LITERAL
        };
        return;
    }
}

const noRvalue = {
    error: 'no R value at all',
    token: tokens.PREDICATE_ELT_LITERAL,
}

function* absorbRExpPredicate(str = '', start = 0, end = str.length - 1) {
    // just absorb till you find an = without escaped with \\
    if (start >= end) {
        yield noRvalue;
        return;
    }
    let i = start;
    while (i <= end) {
        if (str[i] === ']' && str[i - 1] !== '\\') {
            if (i === start) {
                yield noRvalue;
                return;
            }
            yield {
                value: str.slice(start, i),
                start: start,
                end: Math.max(start, i - 1),
                token: tokens.PREDICATE_ELT_LITERAL,
            };
            break;
        }
        i++;
    }
    // not good
    if (i > end) {
        yield {
            error: 'invalid R-exp literal predicate, no following "]" found',
            value: str.slice(start, end + 1),
            start: start,
            end,
            token: tokens.PREDICATE_ELT_LITERAL
        };
        return;
    }
}

const noClosingBracket = {
    error: 'no closing ] found',
    token: tokens.BRACKET_CLOSE,
};

function* predicateHolisticAbsorber(str = '', start = 0, end = max(str.length - 1, 0)) {
    if (str[start] !== '[') {
        return;
    }
    yield {
        token: tokens.BRACKET_OPEN,
        value: '[',
        start,
        end: start
    };
    let i = start + 1
    let [clause] = Array.from(predicateRegExpAbsorber(str, i, end));
    if (clause) {
        yield clause;
        if (clause.end === end) {
            return // nothing more
        }
    }
    else {
        // just absorb till you find an = without escaped with \\
        [clause] = Array.from(absorbLExpPredicate(str, i, end));
        yield clause;
    }
    i = (clause.end || 0) + 1;
    // i should be an '='
    if (str[i] !== '=') {
        yield {
            token: tokens.EQUAL_TOKEN,
            error: 'no "=" token found to seperate L-exp and R-exp predicates'
        }
    }
    else {
        yield {
            value: '=',
            token: tokens.EQUAL_TOKEN,
            end: i,
            start: i
        }
    }
    i++;
    // second predicate
    [clause] = Array.from(predicateRegExpAbsorber(str, i, end));
    if (clause) {
        yield clause;

    }
    else {
        [clause] = Array.from(absorbRExpPredicate(str, i, end));
        yield clause;
    }
    if (clause.end === end) {
        return // nothing more
    }
    i = (clause.end || 0) + 1;
    if (str[i] !== ']') {
        yield noClosingBracket;
        return;
    }
    yield {
        token: tokens.BRACKET_CLOSE,
        value: ']',
        start: i,
        end: i
    };
}

const tokenMap= {
    '..': {
        t:tokens.PARENT,
        s:1
    },
    '.': {
        t:tokens.CURRENT,
        s:0
    },
    '**': {
        t:tokens.RECURSIVE_DESCENT,
        s:1
    }
}


function* pathEltAbsorber(str = '', start = 0, end = str.length - 1) {
    let i = start;
    if (str[i] === '/' || end < start) {
        return undefined;
    }
    for (i = start; i <= end; i++) {
        if (str[i] === '/' && str[i - 1] !== '\\') {
            break;
        }
    }
    i--;
    if (i === start) {
        return undefined;
    }
    i++;
    const value = str.slice(start, i);
    const ti = tokenMap[value];
    if (ti){
        const rc = { start, end: start+ti.s, value, token: ti.t };
        yield rc;
        return;
    }
    yield {
        token: tokens.PATHPART,
        start: start,
        end: i - 1,
        value
    };
}

function* pathAbsorber(str = '', start = 0, end = str.length - 1) {
    let i = start;
    let tokenz;
    while (i <= end) {
        if (str[i] === '/' && str[i - 1] !== '\\') {
            yield {
                token: tokens.SLASH,
                value: '/',
                start: i,
                end: i
            };
            i++;
            continue;
        }
        tokenz = Array.from(predicateHolisticAbsorber(str, i, end));
        if (tokenz.length) {
            yield* tokenz;
            let j = tokenz.length - 1;
            for (; j >= 0; j--) {
                if (tokenz[j].end) {
                    break;
                }
            }
            if (j >= 0) {
                i = tokenz[j].end + 1;
            }
            continue;
        }
        tokenz = Array.from(pathEltAbsorber(str, i, end));
        if (tokenz.length) {
            yield* tokenz;
            let j = tokenz.length - 1;
            for (; j >= 0; j--) {
                if (tokenz[j].end) {
                    break;
                }
            }
            if (j >= 0) {
                i = tokenz[j].end + 1;
            }
            continue;
        }
        i++;
    }
}




module.exports = {
    predicateRegExpAbsorber,
    regExpSafe,
    absorbLExpPredicate,
    absorbRExpPredicate,
    predicateHolisticAbsorber,
    pathEltAbsorber,
    pathAbsorber,
    tokens
};