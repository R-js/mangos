import { PathTokenEnum, TokenValueEnum } from './constants.js';
import type { PathToken, PathTokenDTO } from './types/PathToken.js';
import type { PathTokenValueType } from './types/TokenValueType.js';

export class PathTokenImpl implements PathToken {
	static from(o: {
		token: PathTokenValueType;
		value: string;
		start: number;
		end: number;
		error?: string | undefined;
	}): PathTokenImpl {
		return new PathTokenImpl(o.token, o.value, o.start, o.end, o.error);
	}
	constructor(
		token: PathTokenValueType,
		value: string,
		start: number,
		end: number,
		error?: string,
	) {
		this.#token = token;
		this.#value = value;
		this.#end = end;
		this.#start = start;
		if (error) {
			this.#error = error;
		}
	}
	isRoot(): boolean {
		return this.#token === PathTokenEnum.ROOT;
	}
	isSeparator(): boolean {
		return this.#token === PathTokenEnum.SEP;
	}
	isPathElement(): boolean {
		return this.#token === PathTokenEnum.PATHELT;
	}
	isCurrent(): boolean {
		return this.#token === PathTokenEnum.CURRENT;
	}
	isParent(): boolean {
		return this.#token === PathTokenEnum.PARENT;
	}
	equals(ot: PathToken) {
		return ot.type === this.type && ot.value === this.value && ot.error === this.error;
	}
	hasError(): boolean {
		return !!this.error;
	}

	get type() {
		return this.#token;
	}

	get error() {
		return this.#error;
	}

	get value() {
		return this.#value;
	}

	get end() {
		return this.#end;
	}

	get start() {
		return this.#start;
	}

	clone(): PathTokenImpl {
		return PathTokenImpl.from({ token: this.#token, value: this.#value, start: this.#start, end: this.#end, error: this.#error })
	}

	toDTO(): PathTokenDTO {
		return {
			type: TokenValueEnum[this.#token],
			...(this.#error && { error: this.#error }),
			value: this.#value,
			end: this.#end,
			start: this.#start
		}
	}

	#error: string | undefined;
	#token: PathTokenValueType;
	#value: string;
	#end: number;
	#start: number;
}
