import type { Range } from './Range.js';
import type { RootTokenValueType } from './RootTokenValue.js';
export type RootToken = Range & {
	token: RootTokenValueType;
	value: string;
};
