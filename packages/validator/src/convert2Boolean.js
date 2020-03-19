module.exports = function convertToBoolean(str) {
    if (typeof str === 'boolean') {
            return [str, undefined];
    }
    if (typeof str === 'string') {
            let f = str.match(/^(FALSE|TRUE)$/i);
            if (f === null) {
                    return [undefined, `cannot convert to boolean`]
            }
            f = str.toLocaleLowerCase();
            if (f === 'true') return [true, undefined];
            return [false, undefined];
    }
    return [undefined, `cannot convert to boolean for other then string type`];
};
