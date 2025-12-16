export const TokenEnum = {
	SEP: '\x01',
	ROOT: '\x03',
	PATHELT: '\x06',
	PARENT: '\x07',
	CURRENT: '\x08',
} as const;

export type TokenValueEnumType = {
	-readonly [K in keyof typeof TokenEnum as (typeof TokenEnum)[K]]: K;
};

export const TokenValueEnum = (() => {
	const entries = Object.entries(TokenEnum) as {
		[K in keyof typeof TokenEnum]: [K, (typeof TokenEnum)[K]];
	}[keyof typeof TokenEnum][];

	return entries.reduce((obj, [prop, value]) => {
		(obj as Record<typeof value, typeof prop>)[value] = prop;
		return obj;
	}, {} as TokenValueEnumType);
})();
