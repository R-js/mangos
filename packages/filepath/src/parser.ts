import { ddpAbsorber } from './absorbers/ddp.js';
import posixAbsorber from './absorbers/posix.js';
import tdpAbsorber from './absorbers/tdp.js';
import uncAbsorber from './absorbers/unc.js';
import getCWD from './getCWD.js';
import isRootToken from './isRootToken.js';
import { ParsedPath } from './ParsedPath.js';
import { ParsedPathError } from './ParsedPathError.js';
import mapPlatformNames from './platform.js';
import { rootTokenValues } from './rootTokenValues.js';
import { tokens } from './tokens.js';
import type { RootToken } from './types/RootToken.js';
import type { Token } from './types/Token.js';

const absorberMapping = {
	unc: uncAbsorber,
	dos: tdpAbsorber,
	devicePath: ddpAbsorber,
	posix: posixAbsorber,
} as const;

type AbsorberKey = keyof typeof absorberMapping;

export type FileSystem = 'devicePath' | 'unc' | 'dos' | 'posix';

// order of importance
const allNamespaces: FileSystem[] = ['devicePath', 'unc', 'dos', 'posix'] as const;

function firstPath(path = '', options: InferPathOptions = {}): ParsedPath | ParsedPathError | undefined {
	const iterator = inferPathType(path, options);
	const step = iterator.next(); // only get the first one (is also the most likely one)
	if (step.done) {
		return undefined;
	}
	return step.value;
}

function allPath(path = '', options: InferPathOptions = {}): (ParsedPath | ParsedPathError)[] {
	return Array.from(inferPathType(path, options));
}

export type ParsedPathDTO = {
	type: FileSystem;
	path: (Token | RootToken)[];
	firstError?: Token;
};

function createPathProcessor(path: string) {
	return (ns: AbsorberKey): undefined | ParsedPath | ParsedPathError => {
		// get all path tokens at once
		const _tokens = Array.from(absorberMapping[ns](path));
		if (_tokens.length === 0) {
			return;
		}
		const rc: ParsedPathDTO = { type: ns, path: _tokens };
		const firstError = _tokens.find((t) => !isRootToken(t) && t.error);
		if (firstError) {
			return new ParsedPathError(rc);
		}
		return new ParsedPath(rc);
	};
}

function getErrors(parsed: ParsedPathDTO) {
	return parsed.path
		.reduce((errors, token) => {
			if (isRootToken(token)) {
				return errors;
			}
			if (!token.error) {
				return errors;
			}
			errors.push(token.error);
			return errors;
		}, [] as string[])
		.join('|');
}

function last(arr: (RootToken | Token)[]) {
	return arr[arr.length - 1];
}

function upp(path: (RootToken | Token)[]) {
	let _last: Token | RootToken;
	for (_last = last(path); _last.token === tokens.SEP; _last = last(path)) {
		path.pop();
	}
	// there is a root?
	if (!(_last.token in rootTokenValues)) {
		path.pop();
	}
}

function add(_tokens: (RootToken | Token)[], token: RootToken | Token) {
	if (token.token === tokens.SEP) {
		return; // skip this
	}
	let _last = last(_tokens);
	// remove trailing Seperators
	for (; _last.token === tokens.SEP; _last = last(_tokens)) {
		_tokens.pop();
	}
	_tokens.push({
		token: tokens.SEP,
		start: _last.end + 1,
		end: _last.end + 1,
		value: getSeperator(),
	});
	_tokens.push({
		token: token.token,
		start: _last.end + 2,
		end: _last.end + +2 + token.end,
		value: token.value,
	});
}

function firstPathFromCWD(): ParsedPathDTO {
	// biome-ignore lint/style/noNonNullAssertion: firstPath guarantees to return result of getCWD()
	return firstPath(getCWD())!;
}

function resolve(fromStr = getCWD(), ...toFragments: string[]): ParsedPath | ParsedPathError {
	let firstPathFrom = firstPath(fromStr) ?? firstPathFromCWD();
	if (firstPathFrom instanceof ParsedPathError) {
		throw TypeError(`"from" path contains errors: ${getErrors(firstPathFrom)}`);
	}
	// relative path? normalize!
	if (!isRootToken(firstPathFrom.path[0])) {
		toFragments.unshift(fromStr); // prepend the path in front of the "to"
		// get current cwd, this will give back an absolute path always
		firstPathFrom = firstPathFromCWD();
	}
	// here "parsed" is always a absolute path
	// _to has the instructions to manipulate (resolve) the "parsed" (origin) to their final destination
	return resolvePathObjects(firstPathFrom, ...toFragments);
}

function resolvePathObjects(from: ParsedPath, ...toFragments: string[]): ParsedPath | ParsedPathError {
	const firstToStr = toFragments.shift();
	if (firstToStr === undefined) {
		return from;
	}

	const firstPathTo = firstPath(firstToStr);
	if (firstPathTo === undefined) {
		return from;
	}

	if (firstPathTo instanceof ParsedPathError) {
		throw TypeError(`"to" path contains errors: ${getErrors(firstPathTo)}`);
	}

	// does the "to" have an absolute path?
	if (isRootToken(firstPathTo.path[0])) {
		// disregard fromStr entirely
		// toFragments was unshifted so could be empty array
		if (toFragments.length === 0) {
			return firstPathTo;
		}
		return resolvePathObjects(firstPathTo, ...toFragments);
	}

	// at this point
	// - "fromStr" is guaranteed to be absolute path
	// - "toFragments" is guaranteed not to be an absolute path
	const working = structuredClone(from.path);
	// the "toFragments"
	// Use the first "tokens" to move-up, or down or side-ways fragments to
	for (const token of firstPathTo.path) {
		switch (token.token) {
			case tokens.SEP:
			case tokens.CURRENT:
				break;
			case tokens.PARENT:
				upp(working);
				break;
			case tokens.PATHELT:
				add(working, token);
				break;
			default:
		}
	}
	// finished processing all tokens
	const rc = new ParsedPath({ ...from, path: working });
	//  this check might seem strange at first, but it is perfectly legal to call "resolve" with
	//  resolve(<from-path>, '../dir1/dir2/', 'dir3/dir4')
	//  so the individual "to fragments" themselves can contain multiple directory entries,
	if (toFragments.length === 0) {
		// efficiency+
		return rc;
	}
	return resolvePathObjects(rc, ...toFragments);
}

function getSeperator() {
	if (mapPlatformNames() === 'win32') {
		return '\\';
	}
	return '/';
}

function defaultOptions(options: InferPathOptions = {}) {
	if (allNamespaces.every((fs) => !(fs in options))) {
		// no fs specified at all
		const isWindows = mapPlatformNames() === 'win32';
		return Object.assign(Object.create(null), {
			unc: isWindows,
			dos: isWindows,
			devicePath: isWindows,
			posix: !isWindows,
		});
	}
	return options;
}

type InferPathOptions = {
	[key in FileSystem]+?: boolean;
};

function* inferPathType(path: string, options: InferPathOptions = {}) {
	const finalOptions = defaultOptions(options);
	const processor = createPathProcessor(path);
	const filtered = allNamespaces.filter((f) => finalOptions[f]);
	for (const ns of filtered) {
		const result = processor(ns);
		if (result) {
			yield result;
		}
	}
	return;
}

export { resolve, resolvePathObjects, firstPath, allPath };
