import absorbSuccessiveValues from '../absorbSuccessiveValues.js';
import { PathTokenImpl } from '../PathTokenImpl.js';
import { type PathTokenEnumKeys, TokenValueEnum, togglePathFragment } from '../types.js';

export default function* posixAbsorber(
    str = '',
    start = 0,
    end = str.length - 1,
): Generator<PathTokenImpl, undefined, undefined> {
    // "/" start with "/" or '\' tokens should be converted to "/"
    let i = start;
    const root = absorbSuccessiveValues(str, (s) => s === '/', start, end);
    if (root) {
        yield new PathTokenImpl(TokenValueEnum.ROOT, str.slice(start, root.end + 1), start, root.end);
        i = root.end + 1;
    }
    let toggle = 0;
    while (i <= end) {
        // find pathpart
        const coalescer = toggle === 0 ? (s?: string) => s !== '/' : (s?: string) => s === '/';
        const result = absorbSuccessiveValues(str, coalescer, i, end);
        if (result) {
            const value = str.slice(i, result.end + 1);
            let token: PathTokenEnumKeys = togglePathFragment[toggle % 2];
            if (value === '..') {
                token = TokenValueEnum.PARENT;
            }
            if (value === '.') {
                token = TokenValueEnum.CURRENT;
            }
            yield new PathTokenImpl(token, value, result.start, result.end);
            i = result.end + 1;
        }
        toggle = ++toggle % 2;
    }
}
