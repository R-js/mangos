import { createToken, TokenPredicateRegExp, ErrorInvalidRegExp } from './tokenTypes';
import { regExpSafe } from '../utils';
// we already know the first character is '/'
// so eat everything up till the last  '/' including regexp flags
type ReturnTypeRegExpTokenizer = TokenPredicateRegExp | ErrorInvalidRegExp;

const prefix = 'regexp(/';
const esc = '\\';

export function lookAhead(str = '', start = 0): boolean {
    return str.startsWith(prefix, start);
}

export function lookAheadSize(): number {
    return prefix.length;
}

function escape(str: string, i: number): { esc: string; next: number } {
    if (str[i] === esc) {
        if (str[i + 1] === esc) {
            return { esc: esc + esc, next: i + 2 };
        }
        return {
            esc: str[i + 1],
            next: i + 2
        };
    }
    return { esc: str[i], next: i + 1 };
}

function consumeRegexpFlags(str: string, start: number) {
    let i = start;
    for (i = start; 'igmsuy'.includes(str[i]); i++);
    return { flags: str.slice(start, i), next: i };
}

export default function regexpFunctionAbsorber(str = '', start = 0, end = str.length - 1): ReturnTypeRegExpTokenizer {
    // the char "stream" starts with "regexp(/" and ends with "/)" or "/<regexp flags>)"
    // guarantee the "[/" has already been checked by the "look-ahead"
    const base = start + prefix.length;
    let i = base;
    let escaped = '';
    // scan for ")" or until you run out of chars
    while (i <= end) {
        // escaping rules
        //  1.  \\/  results in "{esc}/' this is escaping for the benefit of our tokenizer syntax
        //  2.  \\\\/ result in "{esc}{esc}/" this is escaping for the benefit of RegExp itself.
        const { esc, next } = escape(str, i);
        if (!(esc === '/' && next === i + 1)) {
            // not an unescaped "/"µ
            escaped += esc;
            i = next;
            continue;
        }
        i = next;
        break;
    }
    if (i > end) {
        return createToken('error.invalid.regexp', start, end, str.slice(start, end + 1));
    }
    // get flags
    const { flags, next } = consumeRegexpFlags(str, i);
    i = next;
    const regExp = regExpSafe(escaped, flags);
    if (regExp === undefined || str[i] !== ')') {
        return createToken('error.invalid.regexp', start, i, str.slice(start, i + 1));
    }
    return createToken('regexp', start, i, regExp);
}
