import type { PathTokenEnum } from '../constants';

export type PathTokenValueType = (typeof PathTokenEnum)[keyof typeof PathTokenEnum];
