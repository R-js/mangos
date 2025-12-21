import absorbSuccessiveValues from '../absorbSuccessiveValues.js';
import { PathTokenEnum } from '../constants.js';
import getCWD from '../getCWD.js';
import getDrive from '../getDrive.js';
import mapPlatformNames from '../platform.js';
import { PathToken } from '../Token.js';
import { togglePathFragment } from '../togglePathFragment.js';
import type { PathTokenValueType } from '../types/TokenValueType.js';
import validSep from '../validSep.js';
import { ddpAbsorber, regExpOrderedMapDDP } from './ddp.js';
import uncAbsorber, { uncRegExp } from './unc.js';

const regexpLD = /(CON|PRN|AUX|NUL|COM[\\d]|LPT[\\d]|PRN)/i;

const forbiddenRegExp = /[<>:"/|?*<\0}]/;

function isInValidMSDirecotryName(str = '', start = 0, end = str.length - 1) {
	return forbiddenRegExp.test(str.slice(start, end + 1));
}

function tdpRootNeedsCorrection(str: string) {
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
		return new PathToken(PathTokenEnum.ROOT, `${drive.join('')}`, 0, 1);
	}
	return undefined;
}

function tdpFragment(str: string, start: number, end: number) {
	return absorbSuccessiveValues(str, (s) => !validSep(s), start, end);
}

function tdpSeperator(str: string, start: number, end: number) {
	return absorbSuccessiveValues(str, (s) => validSep(s), start, end);
}

function hasLegacyDeviceName(str: string) {
	const match = str.match(regexpLD);
	if (Array.isArray(match)) {
		return match[0];
	}
}

export default function* tdpAbsorber(str = ''): Generator<PathToken, undefined, undefined> {
	let i = 0;
	let end = str.length - 1;
	// needs correction ?
	const result = tdpRootNeedsCorrection(str.slice(i, str.length));
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
				yield winRoot; // all roots DONT have '/' token
				if (result.end >= str.length - 1) {
					// we dont have rest-data
					return;
				}
				// adjust
				str = `${winRoot.value}\\${str.slice(result.end + 1)}`;
				end = end + winRoot.value.length - (result.end + 1) + 1;
				i = winRoot.value.length;
				yield* tdpBodyAbsorber(str, i, end);
				return;
			}
		}
		// illegal char!! as a dos directory name, not good at all
		const value = str.slice(result.start, result.end + 1);
		yield new PathToken(
			PathTokenEnum.PATHELT,
			value,
			0,
			result.end,
			`path ${str} contains invalid ${value} as path element`,
		);

		i = result.end + 1;
	}

	if (str.slice(i, str.length - 1).match(uncRegExp)) {
		return;
	}

	const drive = getDrive(str.slice(i, i + 2).toLowerCase());
	if (drive[0] >= 'a' && drive[0] <= 'z' && drive[1] === ':') {
		yield new PathToken(PathTokenEnum.ROOT, `${drive.join('')}`, i, i + 1);
		i = 2;
	}
	// also a unix path would work if it is win32 system
	yield* tdpBodyAbsorber(str, i, str.length - 1);
}

export function* tdpBodyAbsorber(
	str = '',
	start: number,
	end = str.length - 1,
): Generator<PathToken, undefined, undefined> {
	// also a unix path would work if it is winsos system
	let toggle = 0;
	let i = start;
	while (i <= end) {
		// let token;
		const result = toggle === 0 ? tdpFragment(str, i, end) : tdpSeperator(str, i, end);
		if (result) {
			const value = toggle === 0 ? str.slice(i, result.end + 1) : '\\';
			let token: PathTokenValueType = togglePathFragment[toggle];
			const errors = [];
			if (toggle === 0) {
				switch (value) {
					case '..':
						token = PathTokenEnum.PARENT;
						break;
					case '.':
						token = PathTokenEnum.CURRENT;
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
			yield errors?.length
				? new PathToken(token, value, result.start, result.end, errors?.join('|'))
				: new PathToken(token, value, result.start, result.end);
			i = result.end + 1;
		}
		toggle = ++toggle % 2;
	}
}
