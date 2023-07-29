export type { LineInfo } from './utils/getLineInfo';
export { default as getLineInfo } from './utils/getLineInfo';
export { default as debug } from './ns';
export { default } from './ns';

import { globalConfig } from './globalsState';
import type { GlobalConfig } from './globalsState';
import { createGetColorScheme } from './outputDevice';
import getColorDepth from './utils/getColorDepth';
import isBrowser from './utils/isBrowser';
import isTTY from './utils/isTTY';
import trueOrFalse from './utils/trueOrfalse';
import { nsMap } from './globalsState';
import isNSSelected from './utils/nsSelected';

function fromEnvironment(global: GlobalConfig) {
    const query = process.env['DEBUG'] || '';
    const hideDate = trueOrFalse(process.env['DEBUG_HIDE_DATE'], true);
    const debugColors = trueOrFalse(process.env['DEBUG_COLORS'], true);
    global.query = query;
    global.state = (Number(hideDate) << (1 + Number(debugColors))) << 2;
}

function fromOutputDevice(global: GlobalConfig) {
    const colorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
    global.colorSpace = colorScheme();
}

function fromLocalStorage(global: GlobalConfig) {
    const query = globalThis.localStorage.getItem('DEBUG') || '';
    const hideDate = trueOrFalse(globalThis.localStorage.getItem('DEBUG_HIDE_DATE'), true);
    const debugColors = trueOrFalse(globalThis.localStorage.getItem('DEBUG_COLORS'), true);
    global.query = query;
    global.state = (Number(hideDate) << (1 + Number(debugColors))) << 2;
}

export type GlobalHumanConfig = {
    query: string;
    hideDate: boolean;
    debugColors: boolean;
};

export function setGlobalConfig(options: Partial<GlobalHumanConfig>) {
    // if I am in running in a User Agent, then localStorage is my only truth
    if (isBrowser()) {
        fromLocalStorage(globalConfig);
    } else {
        fromEnvironment(globalConfig);
    }
    // treatment same for web or node
    if (options.query !== undefined) {
        globalConfig.query = options.query;
    }
    if (options.hideDate) {
        globalConfig.state |= Number(options.hideDate) << 1;
    }

    if (options.debugColors) {
        globalConfig.state |= Number(options.debugColors) << 2;
    }
    for (const record of nsMap.values()) {
        if (isNSSelected(record.namespace, globalConfig.query)) {
            record.state |= 1;
        }
    }
}

export function getGlobalConfig() {
    const rc = Object.create(null);
    for (const [key, value] of Object.entries(globalConfig)) {
        Object.defineProperty(rc, key, {
            enumerable: true,
            writable: false,
            value: value
        });
    }
    return rc as unknown as GlobalHumanConfig;
}

function boot() {
    setGlobalConfig({});
}
// side effect
boot();
