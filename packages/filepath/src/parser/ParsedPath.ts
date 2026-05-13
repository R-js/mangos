import type { PathToken, TokenDto } from '../types.js';
import type { FileSystem } from './parser.js';

export type ParsedPathInputOptions = {
    type: FileSystem;
    path: PathToken[];
};

export type ParsedPathDto = {
    type: FileSystem;
    path: TokenDto[];
};

export interface ParsedPath {
    get path(): PathToken[];
    get type(): FileSystem;
    clone(path: PathToken[]): ParsedPath;
    toString(): string;
    isRelative(): boolean;
    toDto(): ParsedPathDto;
    get firstError(): PathToken | undefined;
    get allErrors(): TokenDto[];
    iterator(): Generator<PathToken, void, void>;
}

export class ParsedPathImpl implements ParsedPath {
    #path: PathToken[];
    #type: FileSystem;
    constructor(parsed: ParsedPathInputOptions) {
        this.#type = parsed.type;
        this.#path = parsed.path;
    }
    get path(): PathToken[] {
        return this.#path.map((p) => p.clone());
    }
    get type(): FileSystem {
        return this.#type;
    }
    clone(path: PathToken[]): ParsedPath {
        return new ParsedPathImpl({ type: this.#type, path });
    }
    toString(): string {
        return this.#path.map((token) => token?.error ?? token.value).join('');
    }
    isRelative(): boolean {
        return this.#path[0].isRoot() === false;
    }
    toDto(): ParsedPathDto {
        return {
            type: this.#type,
            path: this.#path.map((pt) => pt.toDto()),
        };
    }
    get firstError(): PathToken | undefined {
        return this.#path.find((p) => p.error);
    }
    get allErrors(): TokenDto[] {
        return this.#path.filter((p) => p.error).map((e) => e.toDto());
    }
    *iterator(): Generator<PathToken, void, void> {
        for (const pElt of this.#path) {
            yield pElt;
        }
    }
}
