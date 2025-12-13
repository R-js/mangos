import { rootTokenValues } from './rootTokenValues.js';
import type { RootToken } from './types/RootToken.js';

// biome-ignore lint/suspicious/noExplicitAny: type guard should accept all input
export default function isRootToken(u: any): u is RootToken {
	return u?.token in rootTokenValues;
}
