import type { FileSystem, ParsedPathDTO } from './parser.js';
import type { Token } from './Token.js';

export class ParsedPath {
	readonly path: Token[];
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
