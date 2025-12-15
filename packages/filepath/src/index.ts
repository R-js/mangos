import { allPath, firstPath, resolve } from './parser.js';
import { rootTokens } from './rootTokens.js';
import { rootTokenValues } from './rootTokenValues.js';

import type { RootToken } from './types/RootToken.js';
import type { Token } from './types/Token.js';
import type { TokenValueType } from './types/TokenValue.js';

export { resolve, firstPath, allPath, rootTokenValues, rootTokens };
export type { RootToken, Token, TokenValueType };
