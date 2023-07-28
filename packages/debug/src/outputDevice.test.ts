import { vi } from 'vitest';

import { createGetColorScheme, createColorSelector, createOutputDevice } from './outputDevice';
import isBrowser from './utils/isBrowser';
import { addTimeDiff } from './utils/formatters';

describe('outputDevice', () => {
    describe('web',()=>{
        beforeAll(()=>{
            vi.mock('./utils/isBrowser.ts', () => {
                return {
                    default: function() {
                        return true;
                    }
                };
            });
        });
        afterAll(() => vi.clearAllMocks());
        it('browser environment detected',() => {
            expect(isBrowser()).toBe(true);
        });
        it('color scheme must be css',() => {
            expect(createGetColorScheme(isBrowser)()).toBe('css');
        });
        it('color picker for css color',()=>{
            const colorScheme = createGetColorScheme(isBrowser);
            const colorPicker = createColorSelector(colorScheme);
            const cssColors = Array.from({length:4}, colorPicker);
            expect(cssColors).toEqual([ '#008000', '#808000', '#000080', '#800080' ]);
        });
        it('outputDevice (no date formatting)',() => {
            const outputLog: any[] = [];
            const colorScheme = createGetColorScheme(isBrowser);
            const colorPicker = createColorSelector(colorScheme);
            const output = createOutputDevice(colorScheme, (...args: any[]) => outputLog.push(args), addTimeDiff);
            const selectedColor = colorPicker();
            output('my namespace', 'hello world', selectedColor, Date.now(), 4);
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
    });
});
