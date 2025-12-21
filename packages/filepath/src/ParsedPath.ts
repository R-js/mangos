import type { FileSystem, ParsedPathDTO } from './parser.js';
import type { PathToken } from './Token.js';

export class ParsedPath {
	readonly path: PathToken[];
	readonly type: FileSystem;
	constructor(parsed: ParsedPathDTO) {
		this.type = parsed.type;
		this.path = parsed.path;
	}
	toString() {
		return this.path.map((token) => token.value).join('');
	}
	isRelative() {
		return this.path[0].isRoot() === false;
	}
}
