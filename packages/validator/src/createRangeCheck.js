
const isInteger = require('./isInteger');

module.exports = function setInteger(integer = false) {
        return function createRangeCheck(m, n) {
                // both should be of type number
                m = m === undefined || m === null ? -Infinity : m;
                n = n === undefined || n === null ? Infinity : n;
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
                        throw new TypeError(`lower boundery m:${m} should be lower then upper boundery n:${n}`)
                }
                return function isInRange(i) {
                        if (typeof i !== 'number') {
                                return [null, `${i} is not a number`];
                        }
                        if (integer) {
                                const [res, err] = isInteger(i);
                                if (err) {
                                        return [null, `${i} is not an integer`];
                                }
                        }
                        if (i >= m && i <= n) {
                                return [i, null];

                        }
                        return [null, `${i} is not between ${m} and ${n} inclusive`];
                };
        }
}