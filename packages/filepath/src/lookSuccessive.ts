import type { Range } from './types/Range.js';

export default function lookSuccessive(
	str: string,
	fn: (_: string | undefined) => boolean,
	start: number,
	end = str.length - 1,
): Range | undefined {
	let i = start;
	let len = 0;
	for (; i <= end; i++) {
		if (fn(str[i])) {
			len++;
			continue;
		}
		break;
	}
	if (len === 0) {
		return;
	}
	// return range
	return {
		end: i - 1,
		start,
	};
}
