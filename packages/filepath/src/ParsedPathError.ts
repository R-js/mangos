import type { Token } from 'Token.js';
import type { FileSystem, ParsedPathDTO } from './parser.js';

export class ParsedPathError {
	readonly path: Token[];
	readonly type: FileSystem;
	constructor(private readonly parsed: ParsedPathDTO) {
		this.path = parsed.path;
		this.type = parsed.type;
	}
	toString() {
		return this.parsed.path
			.map((token) => {
				if (!token.isRoot() && token.error) {
					return token.error;
				}
				return '';
			})
			.join('\n');
	}
}
