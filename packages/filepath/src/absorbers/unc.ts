import { PathTokenEnum } from '../constants.js';
import { PathTokenImpl } from '../PathTokenImpl.js';
import { tdpBodyAbsorber } from './tdp.js';

export const uncRegExp = /^(\/\/|\\\\)([^\\/\\?\\.]+)(\/|\\)([^\\/]+)(\/|\\)?/;

export default function* uncAbsorber(str = ''): Generator<PathTokenImpl, undefined, undefined> {
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

	yield new PathTokenImpl(PathTokenEnum.ROOT, value, 0, endUnc);
	// at this point is should be just a normal dos parsing
	yield* tdpBodyAbsorber(str, endUnc + 1, str.length - 1);
}
