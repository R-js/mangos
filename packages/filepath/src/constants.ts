export const PathTokenEnum = {
	SEP: '\x01',
	ROOT: '\x03',
	PATHELT: '\x06',
	PARENT: '\x07',
	CURRENT: '\x08',
} as const;

export type PathTokenValueEnumType = {
	-readonly [K in keyof typeof PathTokenEnum as (typeof PathTokenEnum)[K]]: K;
};

export const TokenValueEnum = (() => {
	const entries = Object.entries(PathTokenEnum) as {
		[K in keyof typeof PathTokenEnum]: [K, (typeof PathTokenEnum)[K]];
	}[keyof typeof PathTokenEnum][];

	return entries.reduce((obj, [prop, value]) => {
		(obj as Record<typeof value, typeof prop>)[value] = prop;
		return obj;
	}, {} as PathTokenValueEnumType);
})();
