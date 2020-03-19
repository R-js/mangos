module.exports = function convertToNumber(str) {
    if (typeof str !== 'number') {
            const n = parseFloat(str);
            if (isNaN(n)) {
                    return [undefined, `cannot convert to number`]
            }
            return [n, undefined];
    }
    return [str, undefined]; // already a number
};
