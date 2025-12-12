export const tokens = {
	SEP: "\x01",
	PATHELT: "\x06",
	PARENT: "\x07",
	CURRENT: "\x08",
} as const;

export const tokenValues = {
	"\x01": "SEP",
	"\x06": "PATHELT",
	"\x07": "PARENT",
	"\x08": "CURRENT",
} as const;

export type TokenType = keyof typeof tokens;
export type TokenValueType = keyof typeof tokenValues;

export type Range = {
	start: number;
	end: number;
};

const rootTokens = {
	POSIX_ROOT: "\x02", // posix
	TDP_ROOT: "\x03", // traditional dos path
	UNC_ROOT: "\x04", // unc root
	DDP_ROOT: "\x05", // dos device path root
} as const;

export const rootTokenValues = {
	"\x02": "POSIX_ROOT", // posix
	"\x03": "TDP_ROOT", // traditional dos path
	"\x04": "UNC_ROOT", // unc root
	"\x05": "DDP_ROOT", // dos device path root
} as const;

export type RootTokenType = keyof typeof rootTokens;
export type RootTokenValueType = keyof typeof rootTokenValues;

export type RootToken = Range & {
	token: RootTokenValueType;
	value: string;
};

export function isRootToken(u: any): u is RootToken {
	return u?.token in rootTokenValues;
}

export type Token = Range & {
	token: TokenValueType;
	value: string;
	error?: string;
};

const selectorPosix = [tokens.PATHELT, tokens.SEP] as const;

type RegExporderdMapDDP = {
	ddpwithUNC: RegExp;
	ddpwithVolumeUUID: RegExp;
	ddpwithTDP: RegExp;
	unc?: RegExp;
};

const regExpOrderedMapDDP: RegExporderdMapDDP = {
	//  \\?\UNC\Server\Share\
	//  \\.\UNC\Server\Share\
	ddpwithUNC:
		/^(\/\/|\\\\)(.|\\?)(\/|\\)(unc)(\/|\\)([^/\\]+)(\/|\\)([^/\\]+)(\/|\\)?/i,

	// example  \\.\Volume{b75e2c83-0000-0000-0000-602f00000000}\
	// example  \\?\Volume{b75e2c83-0000-0000-0000-602f00000000}\
	ddpwithVolumeUUID:
		/^(\/\/|\\\\)(.|\\?)(\/|\\)(Volume{[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}})(\\|\/)?/i,

	// example  \\?\C:\
	// example  \\.\C:\
	ddpwithTDP: /^(\/\/|\\\\)(.|\\?)(\/|\\)([a-z]:)(\/|\\)?/i,
};

const mathMapFns = {
	ddpwithVolumeUUID(match: RegExpMatchArray) {
		const value = "\\\\?\\" + match[4];
		return {
			token: rootTokens.DDP_ROOT,
			value,
			start: 0,
			end: value.length - 1,
		};
	},
	ddpwithUNC(match: RegExpMatchArray) {
		const value = `\\\\?\\UNC\\${match[6]}\\${match[8]}`;
		return {
			token: rootTokens.DDP_ROOT,
			value,
			start: 0,
			end: value.length - 1,
		};
	},
	ddpwithTDP(match: RegExpMatchArray) {
		const value = `\\\\?\\${match[4]}`;
		return {
			token: rootTokens.DDP_ROOT,
			value,
			start: 0,
			end: value.length - 1,
		};
	},
};

const forbiddenRegExp = /[<>:"/|?*<\0}]/;

const regexpLD = /(CON|PRN|AUX|NUL|COM[\\d]|LPT[\\d]|PRN)/i;

const uncRegExp = /^(\/\/|\\\\)([^\\/\\?\\.]+)(\/|\\)([^\\/]+)(\/|\\)?/;

function hasLegacyDeviceName(str = "", start = 0, end = str.length - 1) {
	const match = str.slice(start, end + 1).match(regexpLD);
	if (Array.isArray(match)) {
		return match[0];
	}
}

export function inferPlatform(): NodeJS.Platform {
	// if (globalThis.navigator.userAgentData?.platform === 'Windows') {
	//     return 'win32';
	// }
	if (typeof process !== "undefined") {
		return process.platform;
	}
	return "linux";
}

export function getCWD() {
	if (globalThis?.process) {
		return global.process.cwd();
	}
	if (globalThis?.location?.pathname) {
		return globalThis.location.pathname;
	}
	return "/";
}

function isInValidMSDirecotryName(str = "", start = 0, end = str.length - 1) {
	return forbiddenRegExp.test(str.slice(start, end + 1));
}

export function* uncAbsorber(
	str = "",
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

export function* ddpAbsorber(
	str = "",
	start = 0,
	end = str.length - 1,
): Generator<Token | RootToken, undefined, undefined> {
	const pks = Object.keys(regExpOrderedMapDDP) as (keyof Omit<
		RegExporderdMapDDP,
		"unc"
	>)[];
	for (const pk of pks) {
		const match = str.match(regExpOrderedMapDDP[pk]);
		if (match === null) {
			continue;
		}
		const record = mathMapFns[pk]?.(match);
		if (!record) {
			continue;
		}
		record.start += start;
		record.end += start;
		yield record;
		yield* tdpBodyAbsorber(str, record.end + 1, end);
		break;
	}
}

function lookSuccessive(
	str: string,
	fn: (_: string | undefined) => boolean,
	start: number,
	end = str.length - 1,
): Range | undefined {
	let i = start;
	let len = 0;
	for (; i <= end; i++) {
		if (fn(str[i])) {
			len++;
			continue;
		}
		break;
	}
	if (len === 0) {
		return;
	}
	// return range
	return {
		end: i - 1,
		start,
	};
}

function validSep(s: string | undefined) {
	return s === "\\" || s === "/";
}

function getPosixFragment(str: string, start: number, end: number) {
	return lookSuccessive(str, (s) => s !== "/", start, end);
}
function tdpFragment(str: string, start: number, end: number) {
	return lookSuccessive(str, (s) => !validSep(s), start, end);
}

// hard to infer , '\\' tokens are actually legal in linux xfs, etx4, etc
export function* posixAbsorber(
	str = "",
	start = 0,
	end = str.length - 1,
): Generator<Token | RootToken, undefined, undefined> {
	// "/" start with "/" or '\' tokens should be converted to "/"
	let i = start;
	const root = lookSuccessive(str, (s) => s === "/", start, end);
	if (root) {
		yield {
			token: rootTokens.POSIX_ROOT,
			start: start,
			end: root.end,
			value: str.slice(start, root.end + 1),
		};
		i = root.end + 1;
	}
	let toggle = 0;
	while (i <= end) {
		// find pathpart
		const result = getPosixFragment(str, i, end);
		if (result) {
			const value = str.slice(i, result.end + 1);
			let token: TokenValueType = selectorPosix[toggle % 2];
			if (value === "..") {
				token = tokens.PARENT;
			}
			if (value === ".") {
				token = tokens.CURRENT;
			}
			yield {
				token,
				start: result.start,
				end: result.end,
				value,
			};
			i = result.end + 1;
		}
		toggle = ++toggle % 2;
	}
}

function getCWDDOSRoot() {
	const cwdPath = getCWD(); // cwd can be anything, even unc //server/share , but not //./unc/ or any other
	const ddpTokens = Array.from(ddpAbsorber(cwdPath));
	if (ddpTokens.length) {
		return ddpTokens[0]; // emit the root
	}
	const uncTokens = Array.from(uncAbsorber(cwdPath));
	if (uncTokens.length) {
		return uncTokens[0];
	}
	// guess its normal tdp
	const drive = cwdPath.slice(0, 2).toLowerCase();
	if (drive[0]! >= "a" && drive[0]! <= "z" && drive[1] === ":") {
		return {
			token: rootTokens.TDP_ROOT,
			value: `${drive}`,
			start: 0,
			end: 1,
		};
	}
	return undefined;
}

function tdpRootNeedsCorrection(str: string): Range | undefined {
	const match = str.match(/^[/\\]+/);
	if (match === null) {
		return;
	}
	if (
		Object.entries({
			...regExpOrderedMapDDP,
			unc: uncRegExp,
		}).find(([_, regexp]) => str.match(regexp))
	) {
		return;
	}
	return { start: 0, end: match[0].length - 1 };
}

function* tdpBodyAbsorber(
	str = "",
	start = 0,
	end = str.length - 1,
): Generator<Token, undefined, undefined> {
	// also a unix path would work if it is winsos system
	let toggle = 0;
	let i = start;
	while (i <= end) {
		// let token;
		const result = tdpFragment(str, i, end);
		if (result) {
			const value = toggle === 0 ? str.slice(i, result.end + 1) : "\\";
			let token: TokenValueType = selectorPosix[toggle]!;
			const errors = [];
			if (toggle === 0) {
				switch (value) {
					case "..":
						token = tokens.PARENT;
						break;
					case ".":
						token = tokens.CURRENT;
						break;
					default: {
						const ldn = hasLegacyDeviceName(value);
						if (ldn) {
							errors.push(`contains forbidden DOS legacy device name: ${ldn}`);
						}
						if (isInValidMSDirecotryName(value)) {
							errors.push(`name "${value}" contains invalid characters`);
						}
					}
				}
			}
			const rc = {
				token,
				start: result.start,
				end: result.end,
				value,
				...(errors.length && { error: errors.join("|") }),
			};
			yield rc;
		}
		i = (result?.end ?? i) + 1;
		toggle = ++toggle % 2;
	}
}

export function* tdpAbsorber(
	str = "",
	start = 0,
	end = str.length - 1,
): Generator<Token | RootToken, undefined, undefined> {
	let i = start;
	// needs correction ?
	const result = tdpRootNeedsCorrection(str.slice(i, end + 1));
	if (result) {
		// it should not match
		const os = inferPlatform();
		if (os === "win32") {
			// in this case we need to have to current drive
			/*
               cwd can be anything "tdp", "unc", and "ddp"
                PROOF:

                > process.chdir('//./unc/pc123/c')  // use a valid host and share on your machine
                > process.cwd()
                    '\\\\.\\unc\\pc123\\c'
            */
			const winRoot = getCWDDOSRoot();
			if (winRoot) {
				winRoot.end += start;
				winRoot.start += start;
				yield winRoot; // all roots DONT have '/' token
				if (result.end >= end) {
					// we dont have rest-data
					return;
				}
				// adjust
				str =
					str.slice(0, start) +
					winRoot.value +
					"\\" +
					str.slice(start + result.end + 1);
				end = end + winRoot.value.length - (result.end + 1) + 1; //
				i = start + winRoot.value.length;
				yield* tdpBodyAbsorber(str, i, end);
				return;
			}
		}
		// illegal char!! as a dos directory name, not good at all
		const value = str.slice(result.start, result.end + 1);
		yield {
			value,
			token: tokens.PATHELT,
			start,
			end: result.end,
			error: `path ${str} contains invalid ${value} as path element`,
		};
		i = result.end + 1;
	}

	if (str.slice(i, end).match(uncRegExp)) {
		return;
	}

	const drive = str.slice(i, i + 2).toLowerCase();
	if (drive[0]! >= "a" && drive[0]! <= "z" && drive[1] === ":") {
		yield {
			token: rootTokens.TDP_ROOT,
			value: `${drive}`,
			start: i,
			end: i + 1,
		};
		i = start + 2;
	}
	// also a unix path would work if it is win32 system
	yield* tdpBodyAbsorber(str, i, end);
}
