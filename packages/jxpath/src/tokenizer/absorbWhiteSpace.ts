import { createToken, TokenWS } from './tokenTypes';

const selection = '\t\n\r\v\x20';

export function lookAhead(str = '', start = 0): boolean {
    return selection.includes(str[start]);
}

export function lookAheadSize(): number {
    return 1;
}

export default function WSAbsorber(str: string, start = 0, end = str.length - 1): TokenWS {
    let i = start;
    while (i <= end) {
        if (!selection.includes(str[i])) {
            break;
        }
        i++;
    }
    if (i > end) {
        return createToken('whitespace', start, end);
    }
    return createToken('whitespace', start, i - 1);
}
