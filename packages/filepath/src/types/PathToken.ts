import type { PathTokenEnum } from '../constants.js';
import type { Token } from './Token';
import type { PathTokenValueType } from './TokenValueType.js';

export interface PathToken extends Token {
	isRoot(): boolean;
	isSeparator(): boolean;
	isPathElement(): boolean;
	isCurrent(): boolean;
	isParent(): boolean;
	equals(ot: PathToken): boolean;
	hasError(): boolean;
	get error(): undefined | string;
	get type(): PathTokenValueType;
	get value(): string;
	get end(): number;
	get start(): number;
	clone(): PathToken;
	toDTO(): PathTokenDTO;
}

export type PathTokenDTO = {
	type: keyof typeof PathTokenEnum;
	error?: undefined | string;
	value: string;
	end: number;
	start: number;
};
