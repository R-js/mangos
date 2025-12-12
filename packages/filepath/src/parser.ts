import {
	ddpAbsorber,
	getCWD,
	inferPlatform,
	isRootToken,
	posixAbsorber,
	type RootToken,
	rootTokenValues,
	type Token,
	tdpAbsorber,
	tokens,
	uncAbsorber,
} from "./tokenizer.js";

const absorberMapping = {
	unc: uncAbsorber,
	dos: tdpAbsorber,
	devicePath: ddpAbsorber,
	posix: posixAbsorber,
} as const;

type AbsorberKey = keyof typeof absorberMapping;

export type FileSystem = "devicePath" | "unc" | "dos" | "posix";

// order of importance
const allNamespaces: FileSystem[] = [
	"devicePath",
	"unc",
	"dos",
	"posix",
] as const;

function firstPath(path = "", options = {}): ParsedPath | undefined {
	const iterator = inferPathType(path, options);
	const step = iterator.next(); // only get the first one (is also the most likely one)
	if (step.done) {
		return undefined;
	}
	return step.value;
}

export type ParsedPath = {
	type: FileSystem;
	path: (Token | RootToken)[];
	firstError?: Token;
};

function createPathProcessor(path: string) {
	return (ns: AbsorberKey): undefined | ParsedPath => {
		// get all path tokens at once
		const _tokens = Array.from(absorberMapping[ns](path));
		if (_tokens.length === 0) {
			return;
		}
		const rc: ParsedPath = { type: ns, path: _tokens };
		const firstError = _tokens.find((t) => !isRootToken(t) && t.error);
		if (firstError && !isRootToken(firstError)) {
			rc.firstError = firstError;
		}
		return rc;
	};
}

function getErrors(parsed: ParsedPath) {
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
		.join("|");
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

function firstPathFromCWD(): ParsedPath {
	// biome-ignore lint/style/noNonNullAssertion: firstPath guarantees to return result of getCWD()
	return firstPath(getCWD())!;
}

function resolve(fromStr: string, ...toFragments: string[]): ParsedPath {
	let firstPathFrom = firstPath(fromStr) ?? firstPathFromCWD();
	if (firstPathFrom?.firstError) {
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

function resolvePathObjects(
	from: ParsedPath,
	...toFragments: string[]
): ParsedPath {
	const firstToStr = toFragments.shift();
	if (firstToStr === undefined) {
		return from;
	}

	const firstPathTo = firstPath(firstToStr);
	if (firstPathTo === undefined) {
		return from;
	}

	if (firstPathTo?.firstError) {
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
	const rc = { ...from, path: working };
	//  this check might seem strange at first, but it is perfectly legal to call "resolve" with
	//  resolve(<from-path>, '../dir1/dir2/', 'dir3/dir4')
	//  so the individual "to fragments" themselves can contain multiple directory entries,
	if (toFragments.length === 0) {
		// efficiency+
		return rc;
	}
	return resolvePathObjects(rc, ...toFragments);
}

function getUserAgentData(): NodeJS.Platform | undefined {
	if ("userAgentData" in navigator) {
		const platform = (navigator.userAgentData as { platform: string }).platform;
		if (platform.toLocaleLowerCase().includes("windows")) {
			return "win32";
		}
		if (platform.toLowerCase().includes("linux")) {
			return "linux";
		}
	}
	if (navigator.platform.toLocaleLowerCase().includes("win")) {
		return "win32";
	}
	if (navigator.platform.toLocaleLowerCase().includes("linux")) {
		return "linux";
	}
}

function getSeperator() {
	const platform: NodeJS.Platform =
		getUserAgentData() ?? process?.platform ?? "linux";
	if (platform === "win32") {
		return "\\";
	}
	return "/";
}

function defaultOptions(options: InferPathOptions = {}) {
	if (allNamespaces.every((fs) => !(fs in options))) {
		// no fs specified at all
		const isWindows = inferPlatform() === "win32";
		Object.assign(options, {
			unc: isWindows,
			dos: isWindows,
			devicePath: isWindows,
			posix: !isWindows,
		});
	}
	return options;
}

export type InferPathOptions = {
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

export { inferPathType, resolve };
