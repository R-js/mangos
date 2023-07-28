import { evalAllNS } from '@src/ns';
import { globalConfig } from '@src/globalsState';

export type Config = {
    namespaces: string;
    state: number;
    ttyColorDepth: number;
    lastColorIndex: number;
};

export function setConfig(options: Partial<Omit<Config, 'web'>>): boolean {
    let changed = 0;
    if (options.namespaces !== undefined && globalConfig.namespaces !== options.namespaces) {
        // validate namespaces before altering
        globalConfig.namespaces = options.namespaces;
        changed++;
    }
    if (options.showDate !== undefined && globalConfig.showDate !== options.showDate) {
        globalConfig.showDate = options.showDate;
        changed++;
    }
    if (options.useColors !== undefined && globalConfig.useColors !== options.useColors) {
        globalConfig.useColors = options.useColors;
        changed++;
    }
    if (changed > 0) {
        evalAllNS();
    }
    return changed > 0;
}

export function getConfig(): Config {
    const rc = Object.create(null);

    for (const [key, value] of Object.entries(globalConfig)) {
        Object.defineProperty(rc, key, {
            enumerable: true,
            writable: false,
            value: value
        });
    }

    return rc as unknown as Config;
}
