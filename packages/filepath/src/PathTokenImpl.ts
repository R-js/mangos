import { type PathToken, type PathTokenEnumKeys, type TokenDto, TokenValueEnum } from './types.js';

export class PathTokenImpl implements PathToken {
    static from(o: {
        type: PathTokenEnumKeys;
        value: string;
        start: number;
        end: number;
        error?: string | undefined;
    }): PathTokenImpl {
        return new PathTokenImpl(o.type, o.value, o.start, o.end, o.error);
    }
    constructor(type: PathTokenEnumKeys, value: string, start: number, end: number, error?: string) {
        this.#type = type;
        this.#value = value;
        this.#end = end;
        this.#start = start;
        if (error) {
            this.#error = error;
        }
    }
    isRoot(): boolean {
        return this.#type === TokenValueEnum.ROOT;
    }
    isSeparator(): boolean {
        return this.#type === TokenValueEnum.SEP;
    }
    isPathElement(): boolean {
        return this.#type === TokenValueEnum.PATH_ELT;
    }
    isCurrent(): boolean {
        return this.#type === TokenValueEnum.CURRENT;
    }
    isParent(): boolean {
        return this.#type === TokenValueEnum.PARENT;
    }
    equals(ot: PathToken) {
        return ot.type === this.#type && ot.value === this.value && ot?.error === this?.error;
    }
    hasError(): boolean {
        return !!this.error;
    }
    get type(): PathTokenEnumKeys {
        return this.#type;
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

    clone(): PathToken {
        return new PathTokenImpl(this.#type, this.#value, this.#start, this.#end, this.#error);
    }

    toDto(): TokenDto {
        return {
            type: this.#type,
            ...(this.#error && { error: this.#error }),
            value: this.#value,
            end: this.#end,
            start: this.#start,
        };
    }

    #error: string | undefined;
    #type: PathTokenEnumKeys;
    #value: string;
    #end: number;
    #start: number;
}
