module.exports = function convertToBoolean(str) {
    if (typeof str === 'boolean') {
            return [str, null];
    }
    if (typeof str === 'string') {
            let f = str.match(/^(FALSE|TRUE)$/i);
            if (f === null) {
                    return [null, `cannot convert to boolean`]
            }
            f = str.toLocaleLowerCase();
            if (f === 'true') return [true, null];
            return [false, null];
    }
    return [null, `cannot convert to boolean for other then string type`];
};
