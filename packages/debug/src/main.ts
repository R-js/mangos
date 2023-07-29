export type { LineInfo } from './utils/getLineInfo';
export { default as getLineInfo } from './utils/getLineInfo';

import { globalConfig } from './globalsState';
import type { GlobalConfig } from './globalsState';
import { createGetColorScheme } from './outputDevice';
import getColorDepth from './utils/getColorDepth';
import isBrowser from './utils/isBrowser';
import isTTY from './utils/isTTY';
import trueOrFalse from './utils/trueOrfalse';
import { nsMap } from './globalsState';
import isNSSelected from './utils/nsSelected';
import type { GlobalHumanConfig } from './main.types';

function fromEnvironment(global: GlobalConfig) {
    const query = process.env['DEBUG'] || '';
    const hideDate = trueOrFalse(process.env['DEBUG_HIDE_DATE'], true);
    const debugColors = trueOrFalse(process.env['DEBUG_COLORS'], true);
    global.query = query;
    global.state = (Number(hideDate) << 1) + (Number(debugColors) << 2);
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
    global.state = (Number(hideDate) << 1) + (Number(debugColors) << 2);
}

function toLocalStorage(global: GlobalConfig) {
    if (!global.query) {
        localStorage.removeItem('DEBUG');
        localStorage.removeItem('DEBUG_HIDE_DATE');
        localStorage.removeItem('DEBUG_COLORS');
        global.state = 6;
        return;
    }
    localStorage.setItem('DEBUG', global.query);
    console.log('global.state', global.state);
    const debugColors = global.state & 4 ? 'true' : 'false';
    console.log('debug_colors ->', debugColors);
    localStorage.setItem('DEBUG_COLORS', debugColors);

    localStorage.setItem('DEBUG_HIDE_DATE', global.state & 2 ? 'true' : 'false');
}

export function syncGlobalConfig() {
    setGlobalConfig({});
}

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
    if ('hideDate' in options) {
        if (options.hideDate) {
            globalConfig.state |= 2;
        } else {
            globalConfig.state &= 255 - 2;
        }
    }
    if ('debugColors' in options) {
        if (options.debugColors) {
            globalConfig.state |= 4;
        } else {
            globalConfig.state &= 255 - 4;
        }
    }
    // write back
    if (isBrowser()) {
        toLocalStorage(globalConfig);
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
    fromOutputDevice(globalConfig);
    setGlobalConfig({});
}
// side effect
boot();
