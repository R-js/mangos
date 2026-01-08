import type { PathTokenImpl } from 'PathTokenImpl.js';
import type { FileSystem, ParsedPathDTO } from './parser.js';

export class ParsedPath {
	readonly path: PathTokenImpl[];
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
