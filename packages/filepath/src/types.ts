export const PathTokenEnum = {
    sep: 'SEP',
    root: 'ROOT',
    pathElt: 'PATH_ELT',
    parent: 'PARENT',
    current: 'CURRENT',
} as const;

type PathTokenEnumType = typeof PathTokenEnum;
export type PathTokenEnumKeys = keyof PathTokenEnumType;

type SwapKeyValue<T extends Record<string, string>> = {
    [P in keyof T as T[P]]: P;
};

type PathTokenValueEnum = SwapKeyValue<typeof PathTokenEnum>;

type LastOf<U> = (
    (U extends unknown ? (x: () => U) => void : never) extends (x: infer I) => void
        ? I
        : never
) extends () => infer L
    ? L
    : never;

type EntriesTuple<T, K extends keyof T = keyof T> = [K] extends [never]
    ? []
    : LastOf<K> extends infer P
      ? P extends K
          ? [...EntriesTuple<T, Exclude<K, P>>, [P, T[P]]]
          : []
      : [];

export const TokenValueEnum: PathTokenValueEnum = (() => {
    const entries = Object.entries(PathTokenEnum).map(([prop, value]) => [
        value,
        prop,
    ]) as EntriesTuple<PathTokenValueEnum>;

    return Object.fromEntries(entries) as PathTokenValueEnum;
})();

export interface Token {
    equals(a: Token): boolean;
}

export interface PathToken extends Token {
    isRoot(): boolean;
    isSeparator(): boolean;
    isPathElement(): boolean;
    isCurrent(): boolean;
    isParent(): boolean;
    equals(ot: PathToken): boolean;
    hasError(): boolean;
    get error(): undefined | string;
    get type(): PathTokenEnumKeys;
    get value(): string;
    get end(): number;
    get start(): number;
    clone(): PathToken;
    toDto(): TokenDto;
}

export type TokenDto = {
    type: PathTokenEnumKeys;
    error?: undefined | string;
    value: string;
    end: number;
    start: number;
};

export const togglePathFragment = [TokenValueEnum.PATH_ELT, TokenValueEnum.SEP] as const;
