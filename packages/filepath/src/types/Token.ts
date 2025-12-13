import type { Range } from './Range.js';
import type { TokenValueType } from './TokenValue.js';

export type Token = Range & {
	token: TokenValueType;
	value: string;
	error?: string;
};
