import { createToken, TokenIdentifier } from './tokenTypes';
import { escape } from '../utils';

const specialChars = '{}"\'[/>=<!+-*@ ';

export { specialChars };

// we already know the first character is '/'
// so eat everything up till the last  '/' including regexp flags

// any character that can be used as a js property name
export function lookAhead(str = '', start = 0): boolean {
    const { esc, next } = escape(str, start);
    if (specialChars.includes(esc)) {
        // it was escaped?
        if (next === start + 2) {
            return true;
        }
        return false;
    }
    return true;
}

export function lookAheadSize(): number {
    return 1;
}

export default function identifierAbsorber(str = '', start = 0, end = str.length - 1): TokenIdentifier {
    let escaped = '';
    let i = start;
    while (i <= end) {
        const { esc, next } = escape(str, i);
        // these chars (if not escaped) terminate a identifier sequence
        if (!(specialChars.includes(esc) && i + 1 === next)) {
            i = next;
            escaped += esc;
            continue;
        }
        break;
    }
    if (i > end) {
        return createToken('identifier', start, end, escaped);
    }
    return createToken('identifier', start, i - 1, escaped);
}
