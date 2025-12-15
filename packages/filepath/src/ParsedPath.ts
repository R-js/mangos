import type { FileSystem, ParsedPathDTO } from './parser.js';
import type { RootToken } from './types/RootToken.js';
import type { Token } from './types/Token.js';

export class ParsedPath {
	readonly path: (Token | RootToken)[];
	readonly type: FileSystem;
	constructor(parsed: ParsedPathDTO) {
		this.type = parsed.type;
		this.path = parsed.path;
	}
	toString() {
		return this.path.map((token) => token.value).join('');
	}
}
