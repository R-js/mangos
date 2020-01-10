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
});

// there should be a list of "absorbers" things like
// default
//  absorber for clauses
//    absorber for keys within clauses
//    absorber for value within clauses
//  all these absorbers emit token streams, any absorber token bust be "globally unique"
//  For now how absorbers are hierarchicly linked is programmicly determined, but later do a more declerative way of doing things.
// 

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
            if (sepLoc === -1 || sepLoc >= end - 1 || sepLoc <= start+1) { // there is no token before/after '='
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
    predicateElementTokenizer
};