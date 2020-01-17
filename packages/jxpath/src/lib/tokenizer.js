'use strict';
// 1.token  '/'
// 2.token name [anything not '/']
// 3.you can have escaped \/ this is allowed,  '/' does appear as object property names in rollup "bundle" object.
// AST
// root -> starts with / (or not)
// (root=/)pathelement|path-devider=/ (not escaped)/finalprop
// ast will be an array of 
//  { root->"/" or emoty,
//    pathElts: [] array of path pathelts either names (nothingthing goes that is allowed )
//    see path elts more as navigation instructions
//  target prop is
// 
// emits tokens
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
// [Symbol.iterator] -> A zero arguments function that returns an object, conforming to the iterator protocol.

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
});

// there should be a list of "absorbers" things like
// default
//  absorber for clauses
//    absorber for keys within clauses
//    absorber for value within clauses
//  all these absorbers emit token streams, any absorber token bust be "globally unique"
//  For now how absorbers are hierarchicly linked is programmicly determined, but later do a more declerative way of doing things.
// 

const { min, max } = Math;
const clamp = (l, u, x) => max(l, min(u, x));

function regExpSafe(exp) {
    try {
        return new RegExp(exp);
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
            // can we create a regexp?
            const exp = str.slice(start + 1, i);
            const value = regExpSafe(exp);
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

function* absorbRExpPredicate(str = '', start = 0, end = max(str.length - 1, 0)) {
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
    if (value === '..') {
        yield {
            token: tokens.PARENT,
            start: start,
            end: start + 1,
            value
        }
        return;
    }
    if (value === '.') {
        yield {
            token: tokens.CURRENT,
            start: start,
            end: start,
            value
        }
        return;
    }
    yield {
        token: tokens.PATHPART,
        start: start,
        end: i - 1,
        value: str.slice(start, i)
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


const predicateElementAbsorber = {
    name: 'clauseElt',
    order: 0,
    // generator
    * fn(str, start, end) {
        if (str[start] === '\\' && str[start + 1] === '/') {
            // must end with '/' without previous '\\' of course
            for (let j = start + 2; j <= end; j++) {
                if (str[j] === '/' && str[j - 1] === '\\') {
                    const correctedText = str.slice(start + 2, j - 1);
                    const value = new RegExp(correctedText)
                    yield {
                        value,
                        token: tokens.PREDICATE_ELT_REGEXP,
                        start,
                        end: j
                    };
                    return;
                }
            }
            const value = str.slice(start, end + 1);
            yield {
                error: `no closing "/" found to end the regular expression ${value}`,
                token: tokens.PREDICATE_ELT_REGEXP,
                start,
                end,
                value
            };
            return;
        }
        // absorb till end or untill you see a '=' (not delimited with a "\")
        for (let j = start + 1; j <= end; j++) {
            if (str[j] === '=' && str[j - 1] !== '\\') {
                yield {
                    value: str.slice(start, j),
                    token: tokens.PREDICATE_ELT_LITERAL,
                    start,
                    end: j - 1
                };
                return;
            }
        }
        yield {
            value: str.slice(start, end + 1),
            token: tokens.PREDICATE_ELT_LITERAL,
            start,
            end
        };
        return;
    }
};

const predicateAbsorber = {
    name: 'clause',
    order: 0,
    // generator
    * fn(str, start, end) {
        if (!(str[start] === '[' && str[end] === ']')) {
            return undefined; // not a clause token
        }
        if (end - start < 2) {
            return undefined;
        }
        // find the seperator
        let sepLoc = start + 1;
        do {
            sepLoc = str.indexOf('=', sepLoc);
            if (sepLoc === -1 || sepLoc >= end - 1 || sepLoc <= start + 1) { // there is no token before/after '='
                return undefined;
            }
            if (str[sepLoc - 1] === '\\') {
                sepLoc++;
                continue;
            }
            break;
        } while (sepLoc <= end - 1);
        yield* Array.from(predicateElementTokenizer(str, start + 1, sepLoc - 1));
        yield* Array.from(predicateElementTokenizer(str, sepLoc + 1, end - 1));
        return;
    }
};


const rootAbsorber = {
    name: 'path',
    order: 0,
    * fn(str, start, end) {
        let i = start;
        while (i <= end) {
            if (str[i] === '/' && str[i - 1] !== '\\') {
                yield {
                    token: tokens.SLASH,
                    start: i,
                    end: i,
                    value: str.slice(i, i + 1)
                };
                i++;
                continue;
            }
            // scan for next '/' or end of string
            let i2 = i;
            while (true) {
                if (!str[i2]) {
                    if (i2 !== i) {
                        i2--;
                        break;
                    }
                }
                if (str[i2] === '/') {
                    if (i2 > 0 && str[i2 - 1] !== '\\') {
                        i2--;
                        break;
                    }
                }
                i2++;
            };
            let i3 = i;
            while (str[i3] === '.' && i3 <= i2) {
                i3++;
            };
            if (i3 !== i) {
                const len = i3 - i;
                if (len === 1 || len === 2) {
                    yield {
                        token: len === 1 ? tokens.CURRENT : tokens.PARENT,
                        start: i,
                        end: i3 - 1,
                        value: str.slice(i, i3)
                    };
                    i = i3;
                    continue;
                }
            }
            const toks = Array.from(predicateTokenizer(str, i, i2));
            if (toks.length === 0) {
                const token = {
                    token: tokens.PATHPART,
                    start: i,
                    end: i2,
                    value: str.slice(i, i2 + 1)
                };
                yield token;
                i = token.end + 1;
                continue;
            }
            yield* toks;
            i = toks[toks.length - 1].end + 2;
        }
    },
};


function createTokenizer(lexer) {
    return function* tokenize(str = '', start = 0, end = str.length - 1) {
        yield* lexer.fn(str, start, end);
    }
}

const defaultTokenizer = createTokenizer(rootAbsorber);
const predicateTokenizer = createTokenizer(predicateAbsorber);
const predicateElementTokenizer = createTokenizer(predicateElementAbsorber);

const getTokens = path => Array.from(defaultTokenizer(path));

module.exports = {
    tokens,
    getTokens,
    defaultTokenizer,
    predicateTokenizer,
    predicateElementTokenizer,
    //
    predicateRegExpAbsorber,
    regExpSafe,
    absorbLExpPredicate,
    absorbRExpPredicate,
    predicateHolisticAbsorber,
    pathEltAbsorber,
    pathAbsorber
};