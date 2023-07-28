import isBrowser from '@utils/isBrowser';
import isTTY from '@utils/isTTY';
import isNSSelected from '@utils/nsSelected';
import trueOrFalse from '@utils/trueOrfalse';
import { formatToString, addDate, addTimeDiff } from '@utils/formatters';
import { createColorSelector, createOutputDevice } from '@src/outputDevice';
import { getConfig, setConfig } from '@src/config';
import { createGetColorScheme } from '@src/outputDevice';
import getColorDepth from '@utils/getColorDepth';

import { nsMap } from '@src/globalsState';
import { debug } from '.';

export type NSInfo = {
    enabled: boolean;
    reInit: () => void;
    lastTime?: number;
    diff?: number;
    color?: string; // undefined if it is monochrome (ansi2 color), or the color value (ansi color code or css color value)
};

export type Printer = {
    (formatter: string, ...args: any[]): void;
    // assigned color
    color: string;
    // time difference for this printer
    diff: number;
    // enabled (getter/setter)
    enabled: boolean;
    // namespace of this printer
    namespace: string;
};
export function evalAllNS() {
    for (const info of nsMap.values()) {
        info.reInit();
    }
}

function fromLocalStorage(ns: string) {
    const nsSelected = isNSSelected(ns, globalThis.localStorage.getItem('DEBUG')); // namespace comma separated list
    const hideDate = trueOrFalse(globalThis.localStorage.getItem('DEBUG_HIDE_DATE'), true);
    const debugColors = trueOrFalse(globalThis.localStorage.getItem('DEBUG_COLORS'), true);
    return Number(nsSelected)*1 + Number(hideDate)*2 + Number(debugColors)*4;
}

function fromConfig(ns: string) {
    const config = getConfig();
    const nsSelected = isNSSelected(ns, config.namespaces);
    const hideDate = trueOrFalse(config.hideDate, true);
    const debugColors = trueOrFalse(config.debugColors, true);
    return Number(nsSelected)*1 + Number(hideDate)*2 + Number(debugColors)*4;
}

        if (config.showDate !== showDate) {
            showDate = config.showDate;
            configParamsChanged++;
        }
        if (config.showDate === true) {
            if (useColors === true) {
                configParamsChanged++;
            }
            useColors = false;
        } else if (config.useColors !== useColors) {
            useColors = config.useColors;
            configParamsChanged++;
        }
        if (useColors && selectedColor === undefined && getColorScheme() !== 'ansi2') {
            selectedColor = colorPicker();
        }
        if (configParamsChanged) {
            evalAllNS();
        }
        return;
    }
}

function paramsChanges(statePrev = 0, stateNew = 0) {
    // corrections of user config
    if (!hideDate(stateNew) && debugColors(stateNew)) {
        // correct the bit
        stateNew = stateNew & (255 ^ 4); 
    }
    // start evaluation
    if (nsSelected(statePrev) !== nsSelected(stateNew)) {
        statePrev = nsSelected(stateNew) ? statePrev | 1 : statePrev & (255 ^ 1);
    }
    if (hideDate(statePrev) !== hideDate(stateNew)) {
        statePrev = hideDate(stateNew) ? statePrev | 2 : statePrev & (255 ^ 2);
    }
    if (debugColors(statePrev) !== debugColors(stateNew)) {
        statePrev = debugColors(stateNew) ? statePrev | 4 : statePrev & (255 ^ 4);
    }
    return stateNew;
}

function nsSelected(state: number){
    return state & 1;
}

function hideDate(state: number){
    return state & 2;
}

function debugColors(state: number){
    return state & 4;
}

function evaluateConfig(ns: string, fromLS: number) {
    const fromLSTemp = web ? fromLocalStorage(ns):fromConfig(ns)
    const maybeChanged = paramsChanges(fromLS, fromLSTemp);
    if (fromLS !== maybeChanged){
        fromLS = maybeChanged;
    }
        
        // otherwise copy env vars to mem and rerun evaluateConfig
        const nsSelectionPatternTemp = process.env['DEBUG'] || null;
        // showDate is the inverse of DEBUG_HIDE_DATE
        const showDateTemp = !trueOrFalse(process.env['DEBUG_HIDE_DATE'], true);
        const useColorsTemp = trueOrFalse(process.env['DEBUG_COLORS'], true);
        setConfig({
            namespaces: nsSelectionPatternTemp,
            showDate: showDateTemp,
            useColors: useColorsTemp
        });
        evaluateConfig();
    }
}

const regExp = /(?<!%)%(?<formatSpec>[A-Za-z])/g;

export default function createNs(ns: string, map = nsMap): Printer {
    ns = ns.trim();
    
    if (ns === ''){
        throw new Error('please provide a namespace');
    }
    let record = map.get(ns);
    if (!record){
        const getColorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
        const colorPicker = createColorSelector(getColorScheme);
        const selectedColor = colorPicker();
        const fromLS = isBrowser() ? fromLocalStorage(ns):fromConfig(ns);
        const final = paramsChanges(fromLS, fromLS);
            
        
    }
    // stored in NSInfo
    let fromLS = fromLocalStorage(ns);

    
    
    const getColorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
    const colorPicker = createColorSelector(getColorScheme);
    const selectedColor = colorPicker();

    let record = map.get(ns);
    if (!record){

    }


    if (nsInfoTemp === undefined) {
        nsInfo = {
            enabled: nsSelected,
            reInit: () => init(),
            color: selectedColor // previously selected color
        };

    
    function init(): void {
        // prevent circular execution, see above
        if (runningThisInit) {
            return;
        }
        runningThisInit = true;
        evaluateConfig();
        runningThisInit = false;

        // first time being called?
        if (nsInfo === undefined) {
            // run this section only once
            const nsInfoTemp = nsMap.get(ns);
            if (nsInfoTemp === undefined) {
                nsInfo = {
                    enabled: nsSelected,
                    reInit: () => init(),
                    color: selectedColor // previously selected color
                };
                nsMap.set(ns, nsInfo);
            } else {
                nsInfo = nsInfoTemp; // this namespace was defined elsewhere in the code before
            }
            return;
        }
        // if you are here then it is because of an "update" to config parameters
        // subsequent calls are updates via calling "reInit" in function evalAllNS()
        nsInfo.enabled = nsSelected;
        nsInfo.color = selectedColor;
        // note: we don't have to set it back to nsMap because we keep a local reference to the map value in the closure
    }

    function createPrinter(): Printer {
        const getColorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
        const outputDevice = createOutputDevice(
            getColorScheme,
            console.log,
            addTimeDiff,
            showDate ? addDate : undefined
        );
        function printer(format: string, ...args: any[]): void {
            if (nsInfo === undefined) {
                return; // skip
            }
            if (nsInfo.enabled !== true) {
                return;
            }
            const now = Date.now();
            if (nsInfo.lastTime === undefined) {
                nsInfo.lastTime = now;
                nsInfo.diff = 0;
            } else {
                nsInfo.diff = now - nsInfo.lastTime;
                nsInfo.lastTime = now;
            }
            // matches all % interpolates...
            const matches = Array.from(format.matchAll(regExp));
            // normally matches.length should be equal to ars.length, but we want to be nice
            //  if a %s (example) is not matched by an argument then leave it as is
            //  if there are many more arguments then "%x" format specs then ignore those arguments
            //  NOTE: if there where no matches then still an arry is returned but EMPTY
            if (matches.length === 0) {
                return outputDevice(ns, format, nsInfo.color, nsInfo.lastTime, nsInfo.diff);
            }
            const nrArguments = Math.min(matches.length, args.length);
            const interpolated: string[] = [];
            let i = 0;
            do {
                const start: number = i > 0 ? (matches[i - 1]?.index || (0 as number)) + 2 : 0;
                const stop: number = matches[i]?.index as number;
                if (start !== stop) {
                    interpolated.push(format.slice(start, stop));
                }
                const regExpMatch = matches[i] as RegExpExecArray;
                // formatSpec exist if you are here, force it to string type
                const formatSpec = regExpMatch?.groups?.formatSpec as string;
                interpolated.push(formatToString(formatSpec, args[i]));
                // push stringified value from args[i] according to matches[i]
                i++;
            } while (i < nrArguments);
            // is there a piece of text after the last (%.)?
            const last: number = ((matches[nrArguments - 1]?.index as number) || (0 as number)) + 2;
            if (format.length > last) {
                interpolated.push(format.slice(last, format.length));
            }
            const output = interpolated.join('');
            // here we can intercept and create a throttler
            // use the whole output itself as a key (for now)
            // TODO: scenarios
            // 1.
            // TIME     (In the same microtask)
            // +
            // |      LOG START
            // |
            // |
            // |      SOME LONG RUNNING PROCESS (NO LOGS GENERATED)
            // |
            // v      LOG STOP
            //
            //  This can only be handled if the evaluation is outside
            //  this microtask running in parallel (Web-workers?)
            // 2.
            // TIME     (In the same microtask)
            // +
            // |      LOG START
            // |
            // |      FOR ....
            // |
            // |         LOG SOMETHING (LOTS OF LOGS GENERATED)
            // |
            // v      LOG STOP
            //
            // We have opportunity to handle this within the micro task itself, but it is not ideal
            // there may be pauses between huge log bursts and without some time based cleanup we cannot
            // flush logs at the tail end of a burst
            //
            // 3.
            // TIME     (Spanning several microtasks/microtasks)
            // |      LOG START
            // |
            // |      FOR....
            // |
            // |         AWAIT...
            // |         LOG SOMETHING (LOGS SPREAD OVER MICROTASK/MACROTASKS)
            // |
            // v      LOG STOP
            //
            // This we can solve with a combination of setTimeout and
            // a solution of cleaning up logs within a single microtask

            // Conclusion:
            // Only scenario (1) would need a true parallel process to collapse logs
            // Scenario 2 might miss the tail end of a collapse if we only use collapse within a microtask
            //   //-> combining it with an macrotask based cleanup will only work partially, we will need to wait till
            //    a microtask/macrotask is finished to see the tail of the batch of logs
            // Scenario 3 will work well if we have cleanup with a microtask and macrotask combined
            //   // -> (although problems described in Scenario 2 will not be solved)
            return outputDevice(ns, output, nsInfo.color, nsInfo.lastTime, nsInfo.diff);
        } // printer
        // add some properties
        Object.defineProperties(printer, {
            color: {
                get() {
                    return nsInfo?.color;
                },
                enumerable: true
            },
            diff: {
                get() {
                    return nsInfo?.diff;
                },
                enumerable: true
            },
            enabled: {
                get() {
                    return nsInfo?.enabled;
                },
                enumerable: true
            },
            lastTime: {
                get() {
                    return nsInfo?.lastTime;
                },
                enumerable: true
            }
        });
        return printer as Printer;
    }

    // start execution in this function
    init();
    return createPrinter();
}
