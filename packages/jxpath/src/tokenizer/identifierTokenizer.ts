import { createToken, TokenIdentifier } from './tokenTypes';

const esc = '\\';

const specialChars = '{}"\'[/>=<!+-*@ ';

export { specialChars };

// we already know the first character is '/'
// so eat everything up till the last  '/' including regexp flags

// any character that can be used as a js property name

export function lookAhead(str = '', start = 0): boolean {
    return specialChars.includes(str[start]) === false; // anything goes except for a separator
}

export function lookAheadSize(): number {
    return 1;
}

function escape(str: string, i: number): { esc: string; next: number } {
    if (str[i] === esc) {
        if (str[i + 1] === esc) {
            return { esc: esc, next: i + 2 };
        }
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
