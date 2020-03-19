module.exports  = function isInteger(i) {
    if (typeof i !== 'number') {
            return [undefined, 'not a number'];
    }
    if (Number.isInteger(i)) {
            return [i, undefined];
    }
    return [undefined, 'not an integer']
};
