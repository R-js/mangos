import { vi } from 'vitest';

import { createGetColorScheme, createColorSelector, createOutputDevice } from '../outputDevice';
import isBrowser from '@utils/isBrowser';
import { addTimeDiff, addDate } from '@utils/formatters';
import isTTY from '@utils/isTTY';
import getColorDepth from '@utils/getColorDepth';

describe('outputDevice', () => {
    describe('web', () => {
        beforeEach(() => {
            vi.mock('@utils/isBrowser.ts', () => {
                return {
                    default: () => true
                };
            });
            vi.mock('@utils/isTTY.ts', () => {
                return {
                    default: () => false
                };
            });
            vi.mock('@utils/formatters', () => {
                return {
                    addTimeDiff: (diff: number) => `${diff}ms`,
                    addDate: (ts: number) => new Date(ts).toISOString()
                };
            });
            vi.mock('@utils/getColorDepth', () => {
                return {
                    default: () => 24
                };
            });
        });
        afterEach(() => vi.clearAllMocks());
        it.concurrent('tty (non browser) environment detected', () => {
            expect(isBrowser()).toBe(true);
            expect(isTTY()).toBe(false);
        });
        it.concurrent('color scheme must be css', () => {
            expect(createGetColorScheme(isBrowser, isTTY, getColorDepth)()).toBe('css');
        });
        it.concurrent('color picker for css color', () => {
            expect(isBrowser()).toBe(true);
            expect(isTTY()).toBe(false);
            const colorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
            const colorPicker = createColorSelector(colorScheme);
            const cssColors = Array.from({ length: 4 }, colorPicker);
            expect(cssColors).toEqual(['#008000', '#808000', '#000080', '#800080']);
        });
        it.concurrent('print to outputDevice (no date formatting)', () => {
            const outputLog: any[] = [];
            expect(isBrowser()).toBe(true);
            expect(isTTY()).toBe(false);
            const colorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
            const colorPicker = createColorSelector(colorScheme);
            const output = createOutputDevice(colorScheme, (...args: any[]) => outputLog.push(args), addTimeDiff);
            const selectedColor = colorPicker();
            // last to parameters will be passed to mocked functions
            const ts = 1690554972764; // 28-july-2023
            output('my namespace', 'hello world', selectedColor, ts, 4);
            expect(outputLog).toMatchInlineSnapshot(`
              [
                [
                  "%c%s %c%s %c+%s",
                  "color:#008000",
                  "my namespace",
                  "color:black",
                  "hello world",
                  "color:#008000",
                  "4ms",
                ],
              ]
            `);
        });
        it.concurrent('print to outputDevice (with date formatting)', () => {
            const outputLog: any[] = [];
            const colorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
            const output = createOutputDevice(
                colorScheme,
                (...args: any[]) => outputLog.push(args),
                addTimeDiff,
                addDate
            );
            const ts = 1690554972764; // 28-july-2023
            output('my namespace', 'hello world', undefined, ts, 5);
            expect(outputLog).toMatchInlineSnapshot(`
              [
                [
                  "%s %s %s",
                  "2023-07-28T14:36:12.764Z",
                  "my namespace",
                  "hello world",
                ],
              ]
            `);
        });
        it.concurrent('print to outputDevice (no color or date specified)', () => {
            const outputLog: any[] = [];
            const colorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
            const output = createOutputDevice(colorScheme, (...args: any[]) => outputLog.push(args), addTimeDiff);
            const ts = 1690554972764; // 28-july-2023
            output('my namespace', 'hello world', undefined, ts, 9);
            expect(outputLog).toMatchInlineSnapshot(`
              [
                [
                  "%s %s +%s",
                  "my namespace",
                  "hello world",
                  "9ms",
                ],
              ]
            `);
        });
    });
});
