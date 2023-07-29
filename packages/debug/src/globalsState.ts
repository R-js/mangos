import type { NSInfo } from './ns';
import type { ColorScheme } from '@src/outputDevice';
// global assembly
const nsMap = new Map<string, NSInfo>();

// globals

export type GlobalConfig = {
    query: string;
    state: number;
    lastColorIndex: number;
    colorSpace: ColorScheme;
}

const globalConfig: GlobalConfig = {
    query: '', // what namespaces to show;
    state: 0,
    colorSpace: '',
    lastColorIndex: -1,
};

export { nsMap, globalConfig };
