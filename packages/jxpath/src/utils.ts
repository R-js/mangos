const { max } = Math;

function regExpSafe(exp: string, flags: string): RegExp | undefined {
    try {
        return new RegExp(exp, flags);
    } catch (err) {
        return undefined;
    }
}

const isObject = (o: unknown): boolean => typeof o === 'object' && o !== null && !Array.isArray(o);

export { max, regExpSafe, isObject };