import { rootTokens } from '../rootTokens.js';
import type { RootToken } from '../types/RootToken.js';
import type { Token } from '../types/Token';
import { tdpBodyAbsorber } from './tdp.js';

type RegExporderdMapDDP = {
	ddpwithUNC: RegExp;
	ddpwithVolumeUUID: RegExp;
	ddpwithTDP: RegExp;
	unc?: RegExp;
};

export const regExpOrderedMapDDP: RegExporderdMapDDP = {
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
		const value = `\\\\?\\${match[4]}`;
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

export function* ddpAbsorber(
	str = '',
	start = 0,
	end = str.length - 1,
): Generator<Token | RootToken, undefined, undefined> {
	const pks = Object.keys(regExpOrderedMapDDP) as (keyof Omit<
		RegExporderdMapDDP,
		'unc'
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
