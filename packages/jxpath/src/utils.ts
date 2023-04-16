const { max, min } = Math;

function regExpSafe(exp: string, flags: string): RegExp | undefined {
    if (exp === '') {
        return undefined;
    }
    try {
        return new RegExp(exp, flags);
    } catch (err) {
        return undefined;
    }
}

export const esc = '\\';

export function escape(str: string, i: number): { esc: string; next: number } {
    if (str[i] === esc) {
        if (str[i + 1] === esc) {
            return { esc, next: i + 2 };
        }
        return {
            esc: str[i + 1],
            next: i + 2
        };
    }
    return { esc: str[i], next: i + 1 };
}

const isObject = (o: unknown): boolean => typeof o === 'object' && o !== null && !Array.isArray(o);

export { max, regExpSafe, isObject, min };
