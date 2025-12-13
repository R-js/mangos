type TokenValues = {
	'\x01': 'SEP';
	'\x06': 'PATHELT';
	'\x07': 'PARENT';
	'\x08': 'CURRENT';
};

export type TokenValueType = keyof TokenValues;
