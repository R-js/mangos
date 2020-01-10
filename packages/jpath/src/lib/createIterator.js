module.exports = function createIterator(iterator, cursor = 0) {
    const arr = Array.from(iterator);
    return ({
        next(fn) {
            const rc = { value: undefined, done: false };
            if (cursor >= arr.length) {
                rc.done = true;
                return rc;
            }
            rc.value = arr[cursor];
            if (fn) {
                if (fn(rc)) {
                    cursor++;
                    return rc;
                }
                return { value: undefined, done: true };
            }
            cursor++;
            return rc;
        },
        fork() {
            return createIterator(arr, cursor);
        }
    });
}