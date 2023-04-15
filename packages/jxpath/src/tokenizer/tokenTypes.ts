type Location = {
    start: number;
    end: number;
};

type Value = {
    value: string;
};

type LocationValue = Value & Location;

export type TokenPredicateRegExp = Location & {
    type: 'regexp';
    value: RegExp | string | undefined;
};

export type ErrorInvalidRegExp = LocationValue & {
    type: 'error.invalid.regexp';
};

export type ErrorInvalidRegExpNoEnding = LocationValue & {
    type: 'error.regexp.no.ending';
};

export type ErrorNoClosingBrack = Location & {
    type: 'error.no.closing.bracket';
};

export type ErrorNoLValue = Location & {
    type: 'error.no.L.value';
};

export type ErrorNoRValue = {
    type: 'error.no.R.value';
};

export type ErrorNoEqualSign = LocationValue & {
    type: 'error.no.equal.or.bracket.sign';
};

export type TokenSlash = Location & {
    type: '/';
};

export type TokenParent = Location & {
    type: '..';
};

export type TokenCurrent = Location & {
    type: '.';
};

export type TokenIdentifier = LocationValue & {
    type: 'identifier';
};

export type ErrorNotAnIdentifier = LocationValue & {
    type: 'error.not.an.identifier';
};

export type TokenArrayPredicate = LocationValue & {
    type: 'array.predicate';
};

export type TokenEqual = Location & {
    type: '=';
};

export type TokenRecursiveDescent = Location & {
    type: '**';
};

export type AllTokens =
    | ErrorInvalidRegExp
    | ErrorInvalidRegExpNoEnding
    | ErrorNoLValue
    | ErrorNoRValue
    | ErrorNoClosingBrack
    | ErrorNoEqualSign
    | ErrorNotAnIdentifier
    | TokenPredicateRegExp
    | TokenSlash
    | TokenParent
    | TokenCurrent
    | TokenIdentifier
    | TokenEqual
    | TokenRecursiveDescent;

// lookup table
type AllTokenMap = {
    [Token in AllTokens as Token['type']]: Token;
};

type TokenType = keyof AllTokenMap;

// select a value of the lookup table by its key
type TokenOfTypeMap<T extends TokenType> = AllTokenMap[T];

type ValueType<T> = T extends { value: infer P } ? [P] : never[];

type LocationType<T> = T extends { start: infer P; end: infer Q } ? [P, Q] : never[];

type AllOptionals<T> = [...LocationType<T>, ...ValueType<T>];

export function createToken<
    TName extends TokenType,
    TToken extends TokenOfTypeMap<TName>,
    TValueOptionalType extends AllOptionals<TToken>
>(type: TName, ...valueOptional: TValueOptionalType): TToken {
    if (valueOptional.length === 0) {
        return { type } as unknown as TToken;
    }
    const [start, end, value] = valueOptional;
    if (valueOptional.length === 2) {
        return { type, start, end } as unknown as TToken;
    }
    return { type, start, end, value } as unknown as TToken;
}
