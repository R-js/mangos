import type { ParsedPathDTO } from 'ParsedPath.js';
import type { PathToken } from 'types/PathToken.js';
import type { FileSystem, ParsedPathInputDTO } from './parser.js';

export class ParsedPathError {
	readonly path: PathToken[];
	readonly type: FileSystem;
	constructor(private readonly parsed: ParsedPathInputDTO) {
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
	toDTO(): ParsedPathDTO {
		return {
			type: this.type,
			path: this.path.map(pt => pt.toDTO()),
		}
	}
}
