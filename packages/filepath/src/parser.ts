import { ddpAbsorber } from './absorbers/ddp.js';
import posixAbsorber from './absorbers/posix.js';
import tdpAbsorber from './absorbers/tdp.js';
import uncAbsorber from './absorbers/unc.js';
import { PathTokenEnum } from './constants.js';
import getCWD from './getCWD.js';
import { ParsedPath } from './ParsedPath.js';
import { ParsedPathError } from './ParsedPathError.js';
import mapPlatformNames from './platform.js';
import { PathToken } from './Token.js';

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
	if (path === '') {
		return undefined;
	}
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
	path: PathToken[];
	firstError?: number; // index in path at wich the first error occurs
};

function createPathProcessor(path: string) {
	return (ns: AbsorberKey): undefined | ParsedPath | ParsedPathError => {
		// get all path tokens at once
		const _tokens = Array.from(absorberMapping[ns](path));
		if (_tokens.length === 0) {
			return;
		}
		const rc: ParsedPathDTO = { type: ns, path: _tokens };
		const hasError = _tokens.some((t) => !!t.error);
		if (hasError) {
			return new ParsedPathError(rc);
		}
		return new ParsedPath(rc);
	};
}

function getErrors(parsed: ParsedPathDTO) {
	return parsed.path
		.reduce((errors, token) => {
			if (!token.error) {
				return errors;
			}
			errors.push(token.error);
			return errors;
		}, [] as string[])
		.join('|');
}

function last(arr: PathToken[]) {
	return arr[arr.length - 1];
}

function upp(path: PathToken[]) {
	let _last: PathToken;
	for (_last = last(path); _last.token === PathTokenEnum.SEP; _last = last(path)) {
		path.pop();
	}
	if (_last !== path[0]) {
		path.pop();
	}
}

function add(_tokens: PathToken[], token: PathToken) {
	if (token.token === PathTokenEnum.SEP) {
		return; // skip this
	}
	let _last = last(_tokens);
	// remove trailing Seperators
	for (; _last.token === PathTokenEnum.SEP; _last = last(_tokens)) {
		_tokens.pop();
	}
	_tokens.push(new PathToken(PathTokenEnum.SEP, getSeperator(), _last.end + 1, _last.end + 1));
	_tokens.push(new PathToken(token.token, token.value, _last.end + 2, _last.end + +2 + token.end));
}

function firstPathFromCWD(): ParsedPath {
	return firstPath(getCWD()) as ParsedPath;
}

function resolve(fromStr = getCWD(), ...toFragments: string[]): ParsedPath {
	let firstPathFrom = firstPath(fromStr) ?? firstPathFromCWD();
	if (firstPathFrom instanceof ParsedPathError) {
		throw TypeError(`"from" path contains errors: ${getErrors(firstPathFrom)}`);
	}
	// relative path? normalize!
	if (firstPathFrom.isRelative()) {
		toFragments.unshift(fromStr); // prepend the path in front of the "to"
		// get current cwd, this will give back an absolute path always
		firstPathFrom = firstPathFromCWD();
	}
	// here "parsed" is always a absolute path
	// _to has the instructions to manipulate (resolve) the "parsed" (origin) to their final destination
	return resolvePathObject(firstPathFrom, ...toFragments);
}

function resolvePathObject(from: ParsedPath, ...toFragments: string[]): ParsedPath {
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
	if (!firstPathTo.isRelative()) {
		// disregard fromStr entirely
		// toFragments was unshifted so could be empty array
		if (toFragments.length === 0) {
			return firstPathTo;
		}
		return resolvePathObject(firstPathTo, ...toFragments);
	}

	// at this point
	// - "fromStr" is guaranteed to be absolute path
	// - "toFragments" is guaranteed not to be an absolute path
	const working = structuredClone(from.path);
	// the "toFragments"
	// Use the first "tokens" to move-up, or down or side-ways fragments to
	for (const token of firstPathTo.path) {
		switch (token.token) {
			case PathTokenEnum.SEP:
			case PathTokenEnum.CURRENT:
				break;
			case PathTokenEnum.PARENT:
				upp(working);
				break;
			case PathTokenEnum.PATHELT:
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
	return resolvePathObject(rc, ...toFragments);
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

export { resolve, resolvePathObject, firstPath, allPath };
