module.exports  = function isInteger(i) {
    if (typeof i !== 'number') {
            return [null, 'not a number'];
    }
    if (Number.isInteger(i)) {
            return [i, null];
    }
    return [null, 'not an integer']
};
