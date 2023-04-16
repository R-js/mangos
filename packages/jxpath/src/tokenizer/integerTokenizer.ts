import { createToken, TokenInteger } from './tokenTypes';
const selection = '0123456789';

export function lookAhead(str = '', start = 0): boolean {
    return selection.includes(str[start]);
}

export function lookAheadSize(): number {
    return 1;
}

export default function integerAbsorber(str = '', start = 0, end = str.length - 1): TokenInteger {
    let i = start;
    while (i <= end) {
        if (!selection.includes(str[i])) {
            break;
        }
        i++;
    }
    if (i > end) {
        return createToken('integer', start, end, parseInt(str.slice(start, end + 1), 10));
    }
    return createToken('integer', start, i - 1, parseInt(str.slice(start, i), 10));
}
