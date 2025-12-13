import absorbSuccessiveValues from '../absorbSuccessiveValues.js';
import { rootTokens } from '../rootTokens.js';
import { togglePathFragment } from '../togglePathFragment.js';
import { tokens } from '../tokens.js';
import type { RootToken } from '../types/RootToken.js';
import type { Token } from '../types/Token.js';
import type { TokenValueType } from '../types/TokenValue.js';

export default function* posixAbsorber(
	str = '',
	start = 0,
	end = str.length - 1,
): Generator<Token | RootToken, undefined, undefined> {
	// "/" start with "/" or '\' tokens should be converted to "/"
	let i = start;
	const root = absorbSuccessiveValues(str, (s) => s === '/', start, end);
	if (root) {
		yield {
			token: rootTokens.POSIX_ROOT,
			start: start,
			end: root.end,
			value: str.slice(start, root.end + 1),
		};
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
				token = tokens.PARENT;
			}
			if (value === '.') {
				token = tokens.CURRENT;
			}
			yield {
				token,
				start: result.start,
				end: result.end,
				value,
			};
			i = result.end + 1;
		}
		toggle = ++toggle % 2;
	}
}
