import type { FileSystem, ParsedPathInputDTO } from './parser.js';
import type { PathToken, PathTokenDTO } from './types/PathToken.js';

export class ParsedPath {
	readonly path: PathToken[];
	readonly type: FileSystem;
	constructor(parsed: ParsedPathInputDTO) {
		this.type = parsed.type;
		this.path = parsed.path;
	}
	toString() {
		return this.path.map((token) => token.value).join('');
	}
	isRelative() {
		return this.path[0].isRoot() === false;
	}
	toDTO(): ParsedPathDTO {
		return {
			type: this.type,
			path: this.path.map((pt) => pt.toDTO()),
		};
	}
}

export type ParsedPathDTO = {
	type: FileSystem;
	path: PathTokenDTO[];
};
