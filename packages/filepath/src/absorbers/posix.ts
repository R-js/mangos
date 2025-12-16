import absorbSuccessiveValues from '../absorbSuccessiveValues.js';
import { TokenEnum } from '../constants.js';
import { Token } from '../Token.js';
import { togglePathFragment } from '../togglePathFragment.js';
import type { TokenValueType } from '../types/TokenValueType.js';

export default function* posixAbsorber(
	str = '',
	start = 0,
	end = str.length - 1,
): Generator<Token, undefined, undefined> {
	// "/" start with "/" or '\' tokens should be converted to "/"
	let i = start;
	const root = absorbSuccessiveValues(str, (s) => s === '/', start, end);
	if (root) {
		yield new Token(TokenEnum.ROOT, str.slice(start, root.end + 1), start, root.end);
		i = root.end + 1;
	}
	let toggle = 0;
	while (i <= end) {
		// find pathpart
		const coalescer = toggle === 0 ? (s?: string) => s !== '/' : (s?: string) => s === '/';
		const result = absorbSuccessiveValues(str, coalescer, i, end);
		if (result) {
			const value = str.slice(i, result.end + 1);
			let token: TokenValueType = togglePathFragment[toggle % 2];
			if (value === '..') {
				token = TokenEnum.PARENT;
			}
			if (value === '.') {
				token = TokenEnum.CURRENT;
			}
			yield new Token(token, value, result.start, result.end);
			i = result.end + 1;
		}
		toggle = ++toggle % 2;
	}
}
