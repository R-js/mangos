import { createToken, TokenIdentifier } from './tokenTypes';

// we already know the first character is '/'
// so eat everything up till the last  '/' including regexp flags

// any character that can be used as a js property name

export function lookAhead(str = '', start = 0): boolean {
    return str[start] !== '/'; // anything goes except for a separator
}

export function lookAheadSize(): number {
    return 1;
}

export default function identifierAbsorber(str = '', start = 0, end = str.length - 1): TokenIdentifier {
}