function fullTypeArrayCheck(typeFn, _type, arr) {
    if (!Array.isArray(arr)) {
            return [undefined, `collection is not a array ${arr}`];
    }
    if (arr.length === 0) {
            return [undefined, 'collection is not an empty array'];
    }
    let error = false;
    for (const elt of arr) {
            if (typeFn(elt) !== _type) {
                    error = true;
                    break;
            }
    }
    if (error) {
            return [undefined, 'not all elements were strings'];
    }
    return [arr];
}

module.exports = fullTypeArrayCheck;