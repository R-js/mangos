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
	ddpwithUNC: /^(\/\/|\\\\)(.|\\?)(\/|\\)(unc)(\/|\\)([^/\\]+)(\/|\\)([^/\\]+)(\/|\\)?/i,

	// example  \\.\Volume{b75e2c83-0000-0000-0000-602f00000000}\
	// example  \\?\Volume{b75e2c83-0000-0000-0000-602f00000000}\
	ddpwithVolumeUUID:
		/^(\/\/|\\\\)(.|\\?)(\/|\\)(Volume{[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}})(\\|\/)?/i,

	// example  \\?\C:\
	// example  \\.\C:\
	ddpwithTDP: /^(\/\/|\\\\)(.|\\?)(\/|\\)([a-z]:)(\/|\\)?/i,
};

const createRootValueMap = {
	ddpwithVolumeUUID(match: RegExpMatchArray) {
		return `\\\\?\\${match[4]}`;
	},
	ddpwithUNC(match: RegExpMatchArray) {
		return `\\\\?\\UNC\\${match[6]}\\${match[8]}`;
	},
	ddpwithTDP(match: RegExpMatchArray) {
		return `\\\\?\\${match[4]}`;
	},
};

function createRootToken(value: string) {
	return {
		token: rootTokens.DDP_ROOT,
		value,
		start: 0,
		end: value.length - 1,
	};
}

export function* ddpAbsorber(
	str = '',
	start = 0,
	end = str.length - 1,
): Generator<Token | RootToken, undefined, undefined> {
	const pks = Object.keys(regExpOrderedMapDDP) as (keyof Omit<RegExporderdMapDDP, 'unc'>)[];
	for (const pk of pks) {
		const match = str.match(regExpOrderedMapDDP[pk]);
		if (match === null) {
			continue;
		}
		const rootValue = createRootValueMap[pk](match);
		const record = createRootToken(rootValue);
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
