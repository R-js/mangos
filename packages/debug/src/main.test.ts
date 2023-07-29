import { vi } from 'vitest';

import type { GlobalHumanConfig } from './main.types';

describe('main (node)', () => {
    let mainModule: { getGlobalConfig: any; setGlobalConfig?: (options: Partial<GlobalHumanConfig>) => void; getLineInfo?: any; debug?: any; default?: any; };
    describe('config', () => {
        beforeEach(async () => {
            vi.resetModules()
            vi.stubEnv('DEBUG','*'); // allow all namespaces
            vi.stubEnv('DEBUG_COLORS','true');
            vi.stubEnv('DEBUG_HIDE_DATE','false');
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
            mainModule =  await import('./main');
        });
        afterEach(() => vi.clearAllMocks());
        it('getGlobalConfig', () => {
            const globalState = mainModule.getGlobalConfig();
            expect(globalState).toEqual({
                query: '*',
                state: 0b100, // only DEBUG_COLORS bit is true
                colorSpace: 'ansi256',
                lastColorIndex: -1
            });
        });
        it('setGlobalConfig', () => {
            mainModule.setGlobalConfig!({
                query: 'test-namespace',
                hideDate: true,
                debugColors: true
            });
            // now we query global conifg again and check if all the settings have been made
            const globalState = mainModule.getGlobalConfig();
            expect(globalState).toEqual({
                query: 'test-namespace',
                state: 0b110, //  DEBUG_COLORS bit and HIDE_DATE bit are both true
                colorSpace: 'ansi256',
                lastColorIndex: -1
            });
            // mmm this seems to work
            // localStorage.setItem('hello','world');
            // console.log(localStorage.getItem('hello'));
        });
        
    });
});
