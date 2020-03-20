module.exports = function createStringLengthRangeCheck(m, n) {
    m = (m === undefined || m === null) ? 0 : m;
    n = (n === undefined || n === null) ? Infinity : n;
    if (typeof n !== 'number') {
            const type = typeof n;
            throw new TypeError(`upper boundery n:<${type}>${n} MUST be of type number`);
    }
    if (typeof m !== 'number') {
            const type = typeof m;
            throw new TypeError(`lower boundery m:<${type}>${m} MUST be of type number`);
    }
    if (isNaN(n)) {
            throw new TypeError(`upper boundery n is a NaN`);
    }
    if (isNaN(m)) {
            throw new TypeError(`lower boundery m is a NaN`);
    }
    if (m > n) {
            throw new TypeError(`lower boundery m:${m} should be lower then upper boundery n:${n}`);
    }
    if (m < 0) {
            throw new TypeError(`lower boundery m:${m} should be >= 0`);
    }
    return function isInRange(str, ...rest) {
            if (typeof str !== 'string'){
                    return [undefined, `value type is not of type string: ${typeof str}`];        
            }
            if (str.length >= m && str.length <= n) {
                    return [[str,...rest], undefined, undefined];
            }
            return [undefined, `string of length:${str.length} is not between ${m} and ${n} inclusive`];
    }
}
