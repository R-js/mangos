import { ddpAbsorber } from '../absorbers/ddp.js';
import posixAbsorber from '../absorbers/posix.js';
import tdpAbsorber from '../absorbers/tdp.js';
import uncAbsorber from '../absorbers/unc.js';
import { PathTokenImpl } from '../PathTokenImpl.js';
import { mapPlatformNames } from '../platform.js';
import { type PathToken, TokenValueEnum } from '../types.js';
import { getCWD } from '../utils.js';
import { type ParsedPath, ParsedPathImpl } from './ParsedPath.js';

const absorberMapping = {
    unc: uncAbsorber,
    dos: tdpAbsorber,
    devicePath: ddpAbsorber,
    posix: posixAbsorber,
} as const;

export type FileSystem = keyof typeof absorberMapping;

// order of importance

export function parse(path = ''): ParsedPath | undefined {
    if (path === '') {
        return undefined;
    }
    const iterator = inferPathType(path);
    const step = iterator.next(); // only get the first one (is also the most likely one)
    if (step.done) {
        return undefined;
    }
    return step.value;
}

export function allPlatforms(path = ''): ParsedPath[] {
    return Array.from(inferPathType(path));
}

/** deprecated */
export type ParsedPathInput = {
    type: FileSystem;
    path: PathToken[];
    firstError?: number; // index in path at wich the first error occurs
};

export type InferPathOptions = {
    [key in FileSystem]+?: boolean;
};

export function resolve(fromStr = getCWD(), ...toFragments: string[]): ParsedPath {
    let firstPathFrom: ParsedPath = parse(fromStr) ?? firstPathFromCWD();
    if (firstPathFrom.firstError) {
        throw TypeError(`"from" path contains errors: ${firstPathFrom.allErrors.map((err) => err.value).join('|')}`);
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

export function resolvePathObject(from: ParsedPath, ...toFragments: string[]): ParsedPath {
    const firstToStr = toFragments.shift();
    if (firstToStr === undefined) {
        return from;
    }

    const firstPathTo = parse(firstToStr);
    if (firstPathTo === undefined) {
        return from;
    }

    if (firstPathTo.firstError) {
        throw TypeError(`"to" path contains errors: ${firstPathTo.firstError.error}`);
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
    const working = from.path;
    // the "toFragments"
    // Use the first "tokens" to move-up, or down or side-ways fragments to
    for (const token of firstPathTo.iterator()) {
        switch (true) {
            case token.isSeparator():
            case token.isCurrent():
                break;
            case token.isParent():
                upp(working);
                break;
            case token.isPathElement():
                add(working, token);
                break;
            default:
        }
    }
    // finished processing all tokens
    const rc = from.clone(working);
    //  this check might seem strange at first, but it is perfectly legal to call "resolve" with
    //  resolve(<from-path>, '../dir1/dir2/', 'dir3/dir4')
    //  so the individual "to fragments" themselves can contain multiple directory entries,
    if (toFragments.length === 0) {
        // efficiency+
        return rc;
    }
    return resolvePathObject(rc, ...toFragments);
}

const allNamespaces: FileSystem[] = ['devicePath', 'unc', 'dos', 'posix'] as const;

function createPathProcessor(path: string) {
    return (ns: FileSystem): undefined | ParsedPath => {
        // get all path tokens at once
        const _tokens = Array.from(absorberMapping[ns](path));
        if (_tokens.length === 0) {
            return;
        }
        return new ParsedPathImpl({ type: ns, path: _tokens });
    };
}

function last(arr: PathToken[]) {
    return arr[arr.length - 1];
}

function upp(path: PathToken[]) {
    let _last: PathToken;
    for (_last = last(path); _last.isSeparator(); _last = last(path)) {
        path.pop();
    }
    if (_last !== path[0]) {
        path.pop();
    }
}

function add(_tokens: PathToken[], token: PathToken) {
    if (token.isSeparator()) {
        return; // skip this
    }
    let _last = last(_tokens);
    // remove trailing Seperators
    for (; _last.isSeparator(); _last = last(_tokens)) {
        _tokens.pop();
    }
    _tokens.push(new PathTokenImpl(TokenValueEnum.SEP, getSeperator(), _last.end + 1, _last.end + 1));
    _tokens.push(new PathTokenImpl(token.type, token.value, _last.end + 2, _last.end + +2 + token.end));
}

function firstPathFromCWD(): ParsedPath {
    return parse(getCWD()) as ParsedPath;
}

function getSeperator() {
    if (mapPlatformNames() === 'win32') {
        return '\\';
    }
    return '/';
}

function options(): { unc: boolean; dos: boolean; devicePath: boolean; posix: boolean } {
    // no fs specified at all
    const isWindows = mapPlatformNames() === 'win32';
    return Object.assign(Object.create(null), {
        unc: isWindows,
        dos: isWindows,
        devicePath: isWindows,
        posix: !isWindows,
    });
}

function* inferPathType(path: string) {
    const finalOptions = options();
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
