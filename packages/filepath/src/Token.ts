import { TokenEnum } from './constants.js';
import type { TokenValueType } from './types/TokenValueType.js';

export class Token {
	static from(o: { token: TokenValueType; value: string; start: number; end: number; error?: string }): Token {
		return new Token(o.token, o.value, o.start, o.end, o.error);
	}
	readonly error?: string;
	constructor(
		readonly token: TokenValueType,
		readonly value: string,
		readonly start: number,
		readonly end: number,
		error?: string,
	) {
		if (error) {
			this.error = error;
		}
	}
	isRoot(): boolean {
		return this.token === TokenEnum.ROOT;
	}
	equals(ot: Token) {
		return (
			ot.token === this.token &&
			ot.value === this.value &&
			ot.start === this.start &&
			ot.end === this.end &&
			ot.error === this.error
		);
	}
}
