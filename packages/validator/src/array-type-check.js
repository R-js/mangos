function fullTypeArrayCheck(typeFn, _type, arr) {
    if (!Array.isArray(arr)) {
            return [null, `collection is not a array ${arr}`];
    }
    if (arr.length === 0) {
            return [null, 'collection is not an empty array'];
    }
    let error = false;
    for (const elt of arr) {
            if (typeFn(elt) !== _type) {
                    error = true;
                    break;
            }
    }
    if (error) {
            return [null, 'not all elements were strings'];
    }
    return [arr, null];
}

module.exports = fullTypeArrayCheck;