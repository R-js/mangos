import type { TokenEnum } from '../constants';

export type TokenValueType = (typeof TokenEnum)[keyof typeof TokenEnum];
