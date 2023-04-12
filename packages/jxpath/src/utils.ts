const { max } = Math;

function regExpSafe(exp, flags) {
    try {
        return new RegExp(exp, flags);
    }
    catch (err) {
        return undefined;
    }
}

const isObject = o => typeof o === 'object' && o !== null && !Array.isArray(o);

export { max, regExpSafe, isObject };