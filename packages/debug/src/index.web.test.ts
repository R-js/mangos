import { debug } from '.';
import { vi } from 'vitest';

describe('main', () => {
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
        it('initialize with new namespace', () => {
            const printer = debug('my-first-namespace');
            printer('hello world');
        });
    });
});
