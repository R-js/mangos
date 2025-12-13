import absorbSuccessiveValues from '../absorbSuccessiveValues.js';
import getCWD from '../getCWD.js';
import getDrive from '../getDrive.js';
import mapPlatformNames from '../platform.js';
import { rootTokens } from '../rootTokens.js';
import { togglePathFragment } from '../togglePathFragment.js';
import { tokens } from '../tokens.js';
import type { Range } from '../types/Range.js';
import type { RootToken } from '../types/RootToken.js';
import type { Token } from '../types/Token.js';
import type { TokenValueType } from '../types/TokenValue.js';
import validSep from '../validSep.js';
import { ddpAbsorber, regExpOrderedMapDDP } from './ddp.js';
import uncAbsorber, { uncRegExp } from './unc.js';

const regexpLD = /(CON|PRN|AUX|NUL|COM[\\d]|LPT[\\d]|PRN)/i;

const forbiddenRegExp = /[<>:"/|?*<\0}]/;

function isInValidMSDirecotryName(str = '', start = 0, end = str.length - 1) {
	return forbiddenRegExp.test(str.slice(start, end + 1));
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

function getCWDDOSRoot() {
	const ddpTokens = Array.from(ddpAbsorber(getCWD()));
	if (ddpTokens.length) {
		return ddpTokens[0]; // emit the root
	}
	const uncTokens = Array.from(uncAbsorber(getCWD()));
	if (uncTokens.length) {
		return uncTokens[0];
	}
	// guess its normal tdp
	const drive = getDrive(getCWD());
	if (drive[0] >= 'a' && drive[0] <= 'z' && drive[1] === ':') {
		return {
			token: rootTokens.TDP_ROOT,
			value: `${drive.join('')}`,
			start: 0,
			end: 1,
		};
	}
	return undefined;
}

function tdpFragment(str: string, start: number, end: number) {
	return absorbSuccessiveValues(str, (s) => !validSep(s), start, end);
}

function hasLegacyDeviceName(str = '', start = 0, end = str.length - 1) {
	const match = str.slice(start, end + 1).match(regexpLD);
	if (Array.isArray(match)) {
		return match[0];
	}
}

export default function* tdpAbsorber(
	str = '',
	start = 0,
	end = str.length - 1,
): Generator<Token | RootToken, undefined, undefined> {
	let i = start;
	// needs correction ?
	const result = tdpRootNeedsCorrection(str.slice(i, end + 1));
	if (result) {
		// it should not match
		if (mapPlatformNames() === 'win32') {
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
				str = `${str.slice(0, start) + winRoot.value}\\${str.slice(start + result.end + 1)}`;
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

	const drive = getDrive(str.slice(i, i + 2).toLowerCase());
	if (drive[0] >= 'a' && drive[0] <= 'z' && drive[1] === ':') {
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

export function* tdpBodyAbsorber(str = '', start = 0, end = str.length - 1): Generator<Token, undefined, undefined> {
	// also a unix path would work if it is winsos system
	let toggle = 0;
	let i = start;
	while (i <= end) {
		// let token;
		const result = tdpFragment(str, i, end);
		if (result) {
			const value = toggle === 0 ? str.slice(i, result.end + 1) : '\\';
			let token: TokenValueType = togglePathFragment[toggle];
			const errors = [];
			if (toggle === 0) {
				switch (value) {
					case '..':
						token = tokens.PARENT;
						break;
					case '.':
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
				...(errors.length && { error: errors.join('|') }),
			};
			yield rc;
		}
		i = (result?.end ?? i) + 1;
		toggle = ++toggle % 2;
	}
}
