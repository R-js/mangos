import { regExpSafe, max } from "../utils";

import { createToken } from "./tokenTypes";

// we already know the first character is '/'
// so eat everything up till the last  '/' including regexp flags
function predicateRegExpAbsorber(str = '', start = 0, end = str.length - 1) {
    let i = start;
    let value: RegExp | undefined;
    while (i <= end) {
        if (str[i] === '/' && str[i - 1] !== '\\') {
            // check for regexp flags after the "/" token
            let j = i + 1;
            while ('igmsuy'.includes(str[j])) {
                j++;
            }
            j--;
            let flags = ''
            if (j >= i + 1) {
                flags = str.slice(i + 1, j + 1);
            }
            const exp = str.slice(start + 1, i);
            value = regExpSafe(exp, flags);
            break;
        }
        i++;
    }
    if (value !== undefined) {
        return createToken('regexp', start, i, value);
    }
    return createToken('error.invalid.regexp', start, i, str.slice(start, i + 1));
}


function absorbLeftExpressionPredicate(str = '', start = 0, end = str.length - 1) {
    // just absorb till you find an = without escaped with \\
    let i = start;
    if (start >= end) {
        return createToken('error.no.L.value');
    }
    while (i <= end) {
        if (']='.includes(str[i]) && str[i - 1] !== '\\') {
            break;
        }
        i++;
    }
    if (i === start) {
        return createToken('error.no.L.value');
    }
    if (i > end) {
        return createToken('error.no.equal.or.bracket.sign', start, end, str.slice(start, end + 1));
    }
    return createToken('literal', start, max(start, i - 1), str.slice(start, i));
}

function absorbRightExpressionPredicate(str = '', start = 0, end = str.length - 1) {
    // just absorb till you find an = without escaped with \\
    if (start >= end) {
        return createToken('error.no.R.value');
    }
    let i = start;
    while (i <= end) {
        if (str[i] === ']' && str[i - 1] !== '\\') {
            break;
        }
        i++;
    }
    if (i === start) {
        return createToken('error.no.R.value');;
    }
    if (i > end) {
        return createToken('error.no.closing.bracket', start, end);
    }

    return createToken('literal', start, max(start, i - 1), str.slice(start, i));
}

function* predicateAbsorber(str = '', start = 0, end = max(str.length - 1, 0)) {

    // handle left side first
    yield createToken('[', start, start);
    let i = start + 1
    let leftIsRegExp = false;
    if (str[i] === '/') {
        const token = predicateRegExpAbsorber(str, i + 1, end);
        if (token.end === end) {
            return token;
        }
        yield token;
        i = token.end + 1;
        leftIsRegExp = true;
        // there is maybe more
    }
    else {
        // just absorb as literal till you find an "=" or "]" without escaped with \\
        const token = absorbLeftExpressionPredicate(str, i, end);

        if (token.type === 'error.no.L.value') {
            return token;
        }

        if (token.end === end) {
            return token;
        }
        yield token; // more to come?
        i = token.end + 1;
    }
    // are we done ? (special case where the)
    if (str[i] === ']') {
        return createToken(']', i, i);
    }
    // there is no "=" where it should be
    if (leftIsRegExp === false && str[i] !== '=') {
        return createToken('error.missing.equal.sign.after.literal', i, end);
    }
    // handle right hand side of the expression
    const equalToken = createToken('=', i, i);
    if (i === end - 1) {
        return equalToken;
    }
    yield equalToken; // there is more to come
    i++;

    const token = (str[i] === '/') ? predicateRegExpAbsorber(str, i + 1, end) : absorbRightExpressionPredicate(str, i, end);
    if (token.type === 'error.no.R.value') {
        return token;
    }
    // this only happens if you are missing closing bracket
    if (token.end === end) {
        return token;
    }
    yield token;
    return createToken(']', i, i);
}

function literalExpressionAbsorber(str = '', start = 0, end = str.length - 1) {
    let i = start;
    for (i = start; i <= end; i++) {
        if (str[i] === '/' && str[i - 1] !== '\\') {
            break;
        }
    }
    return (i > end) ? createToken('literal', start, end, str.slice(start, end + 1))
        : createToken('literal', start, i, str.slice(start, i));

}

export default function* pathTokenizer(str = '', start = 0, end = str.length - 1) {
    let i = start;
    while (i <= end) {
        if (str[i] === '/' && str[i - 1] !== '\\') {
            yield createToken('/', start, start);
            i++;
            continue;
        }
        if (str[i] === '[' && str[i - 1] !== '\\') {
            for (const token of predicateAbsorber(str, i, end)) {
                if (token.end === end) {
                    return token;
                }
                yield token;
                i = token.end + 1;
            }
            continue;
        }
        if (str[i] === '.' && str[i + 1] === '.') {
            const token = createToken('..', i, i + 1);
            yield token;
            i = token.end + 1;
            continue;
        }
        if (str[i] === '*' && str[i + 1] === '*') {
            const token = createToken('**', i, i + 1);
            yield token;
            i = token.end + 1;
            continue;
        }
        const token = literalExpressionAbsorber(str, i, end);
        yield token;
        i = token.end + 1;
    }
}
