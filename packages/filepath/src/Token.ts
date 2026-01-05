import { PathTokenEnum } from './constants.js';
import type { PathTokenValueType } from './types/TokenValueType.js';

export class PathToken {
	static from(o: {
		token: PathTokenValueType;
		value: string;
		start: number;
		end: number;
		error?: string;
	}): PathToken {
		return new PathToken(o.token, o.value, o.start, o.end, o.error);
	}
	readonly error?: string;
	constructor(
		readonly token: PathTokenValueType,
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
		return this.token === PathTokenEnum.ROOT;
	}
	isSeparator(): boolean {
		return this.token === PathTokenEnum.SEP;
	}
	isPathElement(): boolean {
		return this.token === PathTokenEnum.PATHELT;
	}
	isCurrent(): boolean {
		return this.token === PathTokenEnum.CURRENT;
	}
	isParent(): boolean {
		return this.token === PathTokenEnum.PARENT;
	}
	equals(ot: PathToken) {
		return ot.token === this.token && ot.value === this.value && ot.error === this.error;
	}
}
