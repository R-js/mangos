import { vi } from 'vitest';

import { createGetColorScheme, createColorSelector, createOutputDevice } from '.';
import isBrowser from '@utils/isBrowser';
import { addTimeDiff, addDate } from '@utils/formatters';
import isTTY from '@utils/isTTY';
import getColorDepth from '@utils/getColorDepth';

describe('outputDevice', () => {
    describe('tty', () => {
        beforeEach(() => {
            vi.mock('@utils/isBrowser.ts', () => {
                return {
                    default: () => false
                };
            });
            vi.mock('@utils/isTTY.ts', () => {
                return {
                    default: () => true
                };
            });
            vi.mock('@utils/getColorDepth.ts', () => {
                return {
                    default: () => 8
                };
            });
            vi.mock('@utils/formatters', () => {
                return {
                    addTimeDiff: (diff: number) => `${diff}ms`,
                    addDate: (ts: number) => new Date(ts).toISOString()
                };
            });
        });
        afterEach(() => vi.clearAllMocks());
        it('tty environment detected', () => {
            expect(isBrowser()).toBe(false);
            expect(isTTY()).toBe(true);
        });
        it('color scheme must be ansi256', () => {
            expect(createGetColorScheme(isBrowser, isTTY, getColorDepth)()).toBe('ansi256');
        });
        it('color picker for ansi256 color', () => {
            const colorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
            const colorPicker = createColorSelector(colorScheme);
            const cssColors = Array.from({ length: 4 }, colorPicker);
            expect(cssColors).toMatchInlineSnapshot(`
              [
                "[31m",
                "[32m",
                "[33m",
                "[34m",
              ]
            `);
        });
        it('print to outputDevice (no date formatting)', () => {
            const outputLog: any[] = [];
            const colorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
            const colorPicker = createColorSelector(colorScheme);
            const output = createOutputDevice(colorScheme, (...args: any[]) => outputLog.push(args), addTimeDiff);
            const selectedColor = colorPicker();
            const ts = 1690554972764; // 28-july-2023
            output('my namespace', 'hello world', selectedColor, ts, 4);
            expect(outputLog).toMatchInlineSnapshot(`
              [
                [
                  "%s%s%s %s %s+%s%s",
                  "[35m",
                  "my namespace",
                  "[0m",
                  "hello world",
                  "[35m",
                  "4ms",
                  "[0m",
                ],
              ]
            `);
        });
        it('print to outputDevice (with date formatting)', () => {
            const outputLog: any[] = [];
            const colorScheme = createGetColorScheme(isBrowser, isTTY, getColorDepth);
            const output = createOutputDevice(
                colorScheme,
                (...args: any[]) => outputLog.push(args),
                addTimeDiff,
                addDate
            );
            const ts = 1690554972764; // 28-july-2023
            output('my namespace', 'hello world', undefined, ts, 4);
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
        it('print to outputDevice (no color or date specified)', () => {
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
