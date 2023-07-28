import { basename } from 'node:path';
import { globalInfo } from './fixture';

import dummyFunction from './dummy-function';

describe('getLineInfo', () => {
    it('line info from within a function', () => {
        const info = dummyFunction();
        expect(info).toMatchInlineSnapshot(`
          {
            "column": 12,
            "fnName": "Module.dummyFunction [as default]",
            "line": 4,
            "pathname": "dummy-function.ts",
          }
        `);
        expect(basename(info.pathname)).toBe('dummy-function.ts');
    });
    it('line info from module global', () => {
        expect(basename(globalInfo.pathname)).toBe('fixture.ts');
    });
});
