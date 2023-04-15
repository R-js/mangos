import { createToken, TokenIdentifier } from './tokenTypes';

const esc = '\\';

const specialChars = '{}"\'[/>=<!+-*@ ';

export { specialChars };

// we already know the first character is '/'
// so eat everything up till the last  '/' including regexp flags

// any character that can be used as a js property name

export function lookAhead(str = '', start = 0): boolean {
    const { esc: e1, next: n1 } = escape(str, start);
    if (specialChars.includes(e1)) {
        if (n1 === start + 2) {
            return true;
        }
        return false;
    }
    return true;
}

export function lookAheadSize(): number {
    return 1;
}

function escape(str: string, i: number): { esc: string; next: number } {
    if (str[i] === esc) {
        return {
            esc: str[i + 1],
            next: i + 2
        };
    }
    return { esc: str[i], next: i + 1 };
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
    return createToken('identifier', start, i - 1, str.slice(start, i));
}
