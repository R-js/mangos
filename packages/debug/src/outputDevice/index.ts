import { globalConfig } from '@src/globalsState';
// colors for "css" colorScheme
const cssColors = [
    '#008000',
    '#808000',
    '#000080',
    '#800080',
    '#008080',
    '#c0c0c0',
    '#808080',
    '#ff0000',
    '#00ff00',
    '#ffff00',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
    '#ffffff'
];

// never changes since this is dependent on where this module runs, two possibilities
// 1. the shell of the process (server side)
// 2. browser environment

export type ColorScheme = 'css' | 'ansi2' | 'ansi16' | 'ansi256' | '';

export function createGetColorScheme(
    isWeb: () => boolean,
    tty: () => boolean,
    colorDepth: () => number
): () => ColorScheme {
    return function getColorScheme() {
        if (isWeb()) {
            return 'css';
        }
        // node
        if (false === tty()) {
            return 'ansi2';
        }
        const depth = colorDepth();
        switch (depth) {
            case 1:
                return 'ansi2';
            // I would expect there to be 3 for 8 colors, but there is no such return from "getColorDepth"
            case 4:
                return 'ansi16';
        }
        return 'ansi256';
    };
}

// pluggable, so easy to test
export function createColorSelector(getScheme: () => ColorScheme) {
    const colorScheme = getScheme();

    return function pickColor() {
        if (colorScheme === 'css') {
            // pick next one round robind stile
            globalConfig.lastColorIndex = (globalConfig.lastColorIndex + 1) % cssColors.length;
            const color = cssColors[globalConfig.lastColorIndex];
            return color;
        }
        if (colorScheme === 'ansi2') {
            return undefined; // no color, just monochrome
        }
        // ansi16 or ansi256
        globalConfig.lastColorIndex = (globalConfig.lastColorIndex + 1) % 16;
        if (globalConfig.lastColorIndex === 0) {
            globalConfig.lastColorIndex++;
        }
        if (globalConfig.lastColorIndex < 8) {
            return `\u001b[${30 + globalConfig.lastColorIndex}m`;
        }
        return `\u001b[${38 + globalConfig.lastColorIndex};1m`;
    };
}

export function createOutputDevice(
    getScheme: () => ColorScheme,
    output = console.log,
    // addTimeDiff and addDate are mutually exclusive, if addDate is defined addTimeDiff is ignored
    addTimeDiff: (diff: number) => string,
    addDate?: (ts: number) => string
) {
    const colorScheme = getScheme();

    return function outputDevice(
        ns: string,
        text: string,
        assignedColor: string | undefined,
        ts: number,
        diff: number
    ) {
        if (colorScheme === 'ansi2') {
            // just print it
            if (addDate) {
                output('%s %s %s %s', addDate(ts), ns, text);
            } else {
                output('%s %s +%s', ns, text, addTimeDiff(diff));
            }
            return;
        }
        if (colorScheme === 'css') {
            if (assignedColor) {
                output(
                    '%c%s %c%s %c+%s',
                    'color:' + assignedColor,
                    ns,
                    'color:black',
                    text,
                    'color:' + assignedColor,
                    addTimeDiff(diff)
                );
            } else if (addDate) {
                output('%s %s %s', addDate(ts), ns, text);
            } else {
                output('%s %s +%s', ns, text, addTimeDiff(diff));
            }
            return;
        }
        // color is 16 or 256
        if (assignedColor) {
            output(
                '%s%s%s %s %s+%s%s',
                assignedColor,
                ns,
                '\u001b[0m',
                text,
                assignedColor,
                addTimeDiff(diff),
                '\u001b[0m'
            );
        } else if (addDate) {
            output('%s %s %s', addDate(ts), ns, text);
        } else {
            output('%s %s +%s', ns, text, addTimeDiff(diff));
        }
    };
}
