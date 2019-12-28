module.exports = function convertToNumber(str) {
    if (typeof str !== 'number') {
            const n = parseFloat(str);
            if (isNaN(n)) {
                    return [null, `cannot convert to number`]
            }
            return [n, null];
    }
    return [str, null]; // already a number
};
