function dummyFunction() {
  return getLineInfo();
}

import getLineInfo from '../getLineInfo';
import { basename } from 'node:path';
import type { LineInfo } from '../getLineInfo';
import { globalInfo } from './fixture';

describe('getLineInfo', () => {
  it('line info from within a function', () => {
    const info = dummyFunction();
    expect(info.fnName).toBe('dummyFunction');
    expect(info.line).toBe(2);
    expect(info.column).toBe(21);
    expect(basename(info.pathname)).toBe('getLineInfo.test.ts');
  });
  it('line info from module global', () => {
    expect(basename(globalInfo.pathname)).toBe('fixture.ts');
  });
});
