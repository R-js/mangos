import { max } from '../utils';
import { createToken } from './tokenTypes';
import type {
  // errors
  ErrorInvalidRegExp,
  ErrorNoLValue,
  ErrorNoRValue,
  ErrorNoEqualSign,
  ErrorNoClosingBrack,
  // valid tokens
  TokenPredicateRegExp,
  TokenIdentifier,
  TokenEqual,
  TokenSlash,
  TokenParent,
  TokenRecursiveDescent
} from './tokenTypes';

import predicateRegExpAbsorber from './regexpTokenizer';

function absorbLeftExpressionPredicate(
  str = '',
  start = 0,
  end = str.length - 1
): ErrorNoLValue | ErrorNoEqualSign | TokenLiteral {
  // just absorb till you find an = without escaped with \\
  let i = start;
  if (start >= end) {
    return createToken('error.no.L.value', i, i);
  }
  while (i <= end) {
    if (']='.includes(str[i]) && str[i - 1] !== '\\') {
      break;
    }
    i++;
  }
  if (i === start) {
    return createToken('error.no.L.value', i, i);
  }
  if (i > end) {
    return createToken('error.no.equal.or.bracket.sign', start, end, str.slice(start, end + 1));
  }
  return createToken('literal', start, max(start, i - 1), str.slice(start, i));
}

function absorbRightExpressionPredicate(
  str = '',
  start = 0,
  end = str.length - 1
): ErrorNoRValue | ErrorNoClosingBrack | TokenLiteral {
  // just absorb till you find an = without escaped with \\
  if (start >= end) {
    return createToken('error.no.R.value');
  }
  let i = start;
  while (i <= end) {
    if (']/'.includes(str[i]) && str[i - 1] !== '\\') {
      break;
    }
    i++;
  }
  if (i === start) {
    return createToken('error.no.R.value');
  }
  if (i > end) {
    return createToken('error.no.closing.bracket', start, end);
  }
  return createToken('literal', start, max(start, i - 1), str.slice(start, i));
}

//TokenBrackOpen
/*
interface Generator<T = unknown, TReturn = any, TNext = unknown> extends Iterator<T, TReturn, TNext> {
    // NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
    next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
    return(value: TReturn): IteratorResult<T, TReturn>;
    throw(e: any): IteratorResult<T, TReturn>;
    [Symbol.iterator](): Generator<T, TReturn, TNext>;
}
*/

type PredicateAbsorberReturnType =
  | TokenRegExpBegin
  | TokenRegExpEnd
  | TokenPredicateRegExp
  | TokenLiteral
  | TokenEqual
  | ErrorNoRValue
  | ErrorInvalidRegExp
  | ErrorNoLValue
  | ErrorNoEqualSign
  | ErrorNoClosingBrack;

type PredicateAbsorberYieldType =
  | ErrorInvalidRegExp
  | ErrorNoEqualSign
  | ErrorNoClosingBrack
  | TokenPredicateRegExp
  | TokenLiteral
  | TokenEqual
  | TokenRegExpBegin;

function* predicateAbsorber(
  str = '',
  start = 0,
  end = max(str.length - 1, start)
): Generator<PredicateAbsorberYieldType | PredicateAbsorberReturnType, undefined, undefined> {
  // handle left side first
  yield createToken('[/', start, start);
  let i = start + 1;
  if (str[i] === '/') {
    const token = predicateRegExpAbsorber(str, i, end);
    yield token;
    if (token.end === end) {
      return;
    }
    i = token.end + 1;
  } else {
    // just absorb as literal till you find an "=" or "]" without escaped with \\
    const token = absorbLeftExpressionPredicate(str, i, end);
    yield token;
    if (token.end === end) {
      return;
    }
    i = token.end + 1;
  }
  // are we done ? (special case where there is only prop name selection)
  if (str[i] === ']') {
    yield createToken('/]', i, i);
    return;
  }

  const equalToken = createToken('=', i, i);
  yield equalToken;
  i++;
  if (i === end) {
    return;
  }
  // handle right hand side of the expression
  if (str[i] === '/') {
    const token = predicateRegExpAbsorber(str, i, end);
    yield token;
    if (token.end === end) {
      return;
    }
    i = token.end + 1;
  } else {
    const token = absorbRightExpressionPredicate(str, i, end);
    yield token;
    if (token.type === 'error.no.R.value' || token.type === 'error.no.closing.bracket') {
      return;
    }
    if (token.end === end) {
      return;
    }
    i = token.end + 1;
  }
  // missing ']'
  if (!(str[i] === ']' && str[i - 1] !== '\\')) {
    const token = createToken('error.no.closing.bracket', start, i);
    yield token;
    if (token.end === end) {
      return;
    }
    //    i = token.end + 1;
  } else {
    yield createToken('/]', i, i + 1);
  }
}

function literalExpressionAbsorber(str = '', start = 0, end = str.length - 1): TokenLiteral {
  let i = start;
  for (i = start; i <= end; i++) {
    if (str[i] === '/' && str[i - 1] !== '\\') {
      break;
    }
  }
  return i > end
    ? createToken('literal', start, end, str.slice(start, end + 1))
    : createToken('literal', start, i - 1, str.slice(start, i));
}
/*
interface Generator<T = unknown, TReturn = any, TNext = unknown> extends Iterator<T, TReturn, TNext> {
    // NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
    next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
    return(value: TReturn): IteratorResult<T, TReturn>;
    throw(e: any): IteratorResult<T, TReturn>;
    [Symbol.iterator](): Generator<T, TReturn, TNext>;
}
*/

type pathTokenizerReturnType = PredicateAbsorberYieldType | PredicateAbsorberReturnType;
type pathTokenizerYieldType =
  | PredicateAbsorberYieldType
  | PredicateAbsorberReturnType
  | TokenSlash
  | TokenParent
  | TokenRecursiveDescent;

export default function* pathTokenizer(
  str = '',
  start = 0,
  end = str.length - 1
): Generator<pathTokenizerYieldType | pathTokenizerReturnType, undefined, undefined> {
  let i = start;
  while (i <= end) {
    if (str[i] === '/' && str[i - 1] !== '\\') {
      yield createToken('/', i, i);
      i++;
      continue;
    }
    if (str[i] === '[' && str[i - 1] !== '\\') {
      const j = i;
      for (const token of predicateAbsorber(str, j, end)) {
        yield token;
        if (token.type === 'error.no.L.value' || token.type === 'error.no.R.value') {
          return;
        }
        if (token.end === end) {
          return;
        }
        i = token.end + 1;
      }
      continue;
    }
    if (str[i] === '.' && str[i + 1] === '.') {
      const token = createToken('..', i, i + 1);
      yield token;
      i = token.end + 1;
      continue;
    }
    if (str[i] === '*' && str[i + 1] === '*') {
      const token = createToken('**', i, i + 1);
      yield token;
      i = token.end + 1;
      continue;
    }
    const token = literalExpressionAbsorber(str, i, end);
    yield token;
    i = token.end + 1;
  }
}
