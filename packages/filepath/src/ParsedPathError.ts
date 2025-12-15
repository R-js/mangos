import isRootToken from './isRootToken.js';
import type { FileSystem, ParsedPathDTO } from './parser.js';
import type { RootToken } from './types/RootToken.js';
import type { Token } from './types/Token.js';

export class ParsedPathError {
	readonly path: (RootToken | Token)[];
	readonly type: FileSystem;
	constructor(private readonly parsed: ParsedPathDTO) {
		this.path = parsed.path;
		this.type = parsed.type;
	}
	toString() {
		return this.parsed.path
			.map((token) => {
				if (!isRootToken(token) && token.error) {
					return token.error;
				}
				return '';
			})
			.join('\n');
	}
}
