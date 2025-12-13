import { rootTokens } from '../rootTokens.js';
import type { RootToken } from '../types/RootToken.js';
import type { Token } from '../types/Token.js';
import { tdpBodyAbsorber } from './tdp.js';

export const uncRegExp = /^(\/\/|\\\\)([^\\/\\?\\.]+)(\/|\\)([^\\/]+)(\/|\\)?/;

export default function* uncAbsorber(
	str = '',
	start = 0,
	end = str.length - 1,
): Generator<Token | RootToken, undefined, undefined> {
	// \\system07\C$\    servername: system07 (of fully qualified netbios,  IP/FQDN address ipv4/ipv6
	//                   c$: shared name
	// \\Server2\Share\Test\Foo.txt
	//                        servername: Server2
	//                        shared name: Share

	/* 2 "//" or 2 "\\"" are also ok in MS Windows */
	// regexp this

	const match = str.match(uncRegExp);
	if (match === null) {
		return; // nothing to do here
	}

	const server = match[2];
	const share = match[4];
	const value = `\\\\${server}\\${share}`;
	const endUnc = value.length - 1;

	yield {
		token: rootTokens.UNC_ROOT,
		value, // delimter at the end makes my IDE (vscode) do weird stuff
		start,
		end: endUnc,
	};
	// at this point is should be just a normal dos parsing
	yield* tdpBodyAbsorber(str, endUnc + 1, end);
}
