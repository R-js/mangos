'use strict';

export type LineInfo = {
  fnName?: string;
  pathname: string;
  line: number;
  column: number;
};

function nonEmptyString(line: any): line is string {
  return typeof line === 'string' && line.trim().length > 0;
}

function getGlobalCall(errLine: string): LineInfo | never | undefined {
  const regExp = /^\s+at (.*):([\d]+):([\d]+)$/;
  let matched = errLine.match(regExp);
  if (matched === null) {
    return undefined;
  }
  // we have success
  try {
    // match browser or node
    const pathname = (matched[1] as string).startsWith('file')
      ? new URL(matched[1] as string).pathname
      : matched[1];
    if (!nonEmptyString(pathname)) {
      throw new Error(
        `internal error #005: pathname is not a non-empty string, matched: ${errLine}`,
      );
    }
    const line = 1 * (matched[2] as unknown as number); // convert to number type
    const column = 1 * (matched[3] as unknown as number); // convert to number type
    return {
      pathname,
      line,
      column,
    };
  } catch (err) {
    throw new Error(
      `internal error #001: (see ReadMe) please file an issue: [${
        (err as unknown as Error).message
      }]`,
    );
  }
}

function getInFunctionCall(errLine: string): LineInfo | never | undefined {
  const regExp = /^\s+at\s(.*)\s\((.*):([\d]+):([\d]+)\)$/;
  const matched = errLine.match(regExp) as string[];
  if (matched === null) {
    return undefined;
  }
  try {
    const fnName = matched[1];
    // match browser or node
    const pathname = (matched[2] as string).startsWith('file')
      ? new URL(matched[2] as string).pathname
      : matched[2];
    if (!nonEmptyString(pathname)) {
      throw new Error(
        `internal error #006: pathname is not a non-empty string, matched: ${errLine}`,
      );
    }
    const line = 1 * (matched[3] as unknown as number); // convert to number type
    const column = 1 * (matched[4] as unknown as number); // convert to number type
    return {
      fnName,
      pathname,
      line,
      column,
    };
  } catch (err) {
    throw new Error(
      `internal error #002: (see ReadMe) please file an issue: [${
        (err as unknown as Error).message
      }]`,
    );
  }
}

function getLineInfo(n = 2): LineInfo | never {
  const err = new Error('dummy');
  const lines = (err.stack || '').split('\n');
  if (lines[n] === undefined) {
    throw new Error(
      `internal error #003: (see ReadMe) please file an issue: [${
        (err as unknown as Error).message
      }]`,
    );
  }

  let info = getGlobalCall(lines[n] as string);
  if (!info) {
    info = getInFunctionCall(lines[n] as string);
  }
  if (!info) {
    throw new Error('internal error #004: (see ReadMe) please file an issue');
  }
  return info;
}

export default getLineInfo;
