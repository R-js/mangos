import { vi } from 'vitest';

import type { GlobalHumanConfig } from './main.types';

describe('main', () => {
    describe('web', () => {
        describe('config', () => {
            let mainModule: {
                getGlobalConfig: any;
                syncGlobalConfig: any;
                setGlobalConfig?: (options: Partial<GlobalHumanConfig>) => void;
                getLineInfo?: any;
            };
            beforeEach(async () => {
                vi.mock('@utils/isBrowser.ts', () => {
                    return {
                        default: () => {
                            return true;
                        }
                    };
                });
                vi.mock('@utils/isTTY.ts', () => {
                    return {
                        default: () => {
                            return false;
                        }
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
                localStorage.setItem('DEBUG', '*'); //
                localStorage.setItem('DEBUG_HIDE_DATE', 'false');
                localStorage.removeItem('DEBUG_COLORS');
                mainModule = await import('./main');
            });
            afterEach(() => {
                vi.resetModules();
                vi.clearAllMocks();
                localStorage.removeItem('DEBUG'); // allow all namespaces
                localStorage.removeItem('DEBUG_COLORS');
                localStorage.removeItem('DEBUG_HIDE_DATE');
            });
            it('getGlobalConfig', () => {
                const globalState = mainModule.getGlobalConfig();
                expect(globalState).toEqual({
                    colorSpace: 'css',
                    lastColorIndex: -1,
                    query: '*',
                    state: 4
                });
            });
            it('sync with syncGlobalConfig', () => {
                localStorage.setItem('DEBUG', 'ns1,ns2'); //
                localStorage.setItem('DEBUG_HIDE_DATE', 'false');
                localStorage.setItem('DEBUG_COLORS', 'true');
                mainModule.syncGlobalConfig();
                const globalState = mainModule.getGlobalConfig();
                expect(globalState).toEqual({
                    colorSpace: 'css',
                    lastColorIndex: -1,
                    query: 'ns1,ns2',
                    state: 4
                });
            });
            it('clear query will reset all fields', () => {
                /*
                    localStorage.setItem('DEBUG', '*'); //
                    localStorage.setItem('DEBUG_HIDE_DATE', 'false');
                    localStorage.removeItem('DEBUG_COLORS');
                */
                mainModule.setGlobalConfig!({ query: '' });
                const globalState = mainModule.getGlobalConfig();
                expect(globalState).toEqual({
                    colorSpace: 'css',
                    lastColorIndex: -1,
                    query: '',
                    state: 6
                });
                expect(localStorage.getItem('DEBUG')).toBeNull();
                expect(localStorage.getItem('DEBUG_HIDE_DATE')).toBeNull();
                expect(localStorage.getItem('DEBUG_COLORS')).toBeNull();
            });
            it('empty options field in setGlobalConfig will sync with localStorage', () => {
                /*
                    localStorage.setItem('DEBUG', '*'); //
                    localStorage.setItem('DEBUG_HIDE_DATE', 'false');
                    localStorage.removeItem('DEBUG_COLORS');
                */
                const globalState1 = mainModule.getGlobalConfig();
                expect(globalState1).toEqual({
                    colorSpace: 'css',
                    lastColorIndex: -1,
                    query: '*',
                    state: 4 // debug colors = true & hide_date = false
                });
                mainModule.setGlobalConfig!({});
                const globalState2 = mainModule.getGlobalConfig();
                expect(globalState2).toEqual({
                    colorSpace: 'css',
                    lastColorIndex: -1,
                    query: '*',
                    state: 4 // only debug_colors is on
                });
                expect(localStorage.getItem('DEBUG')).toBe('*');
                expect(localStorage.getItem('DEBUG_HIDE_DATE')).toBe('false');
                expect(localStorage.getItem('DEBUG_COLORS')).toBe('true');
            });
        });
    });
});
