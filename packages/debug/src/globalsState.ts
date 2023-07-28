import type { NSInfo } from './ns';
import type { Config } from '@src/config';

// global assembly
const nsMap = new Map<string, NSInfo>();

// globals
const globalConfig: Config = {
    namespaces: '', // what namespaces to show;
    state: 0,
    ttyColorDepth: 0,
    prevColorIndex: -1
};

export { nsMap, globalConfig };
