'use strict';
module.exports = function createIterator(iterator, cursor = 0) {
    const arr = Array.from(iterator);
    return {
        advanceWhileTrue(fn) {
            const rc = { done: false };
            do {
                if (cursor >= arr.length) {
                    rc.done = true;
                    rc.value = undefined;
                    return rc;
                }
                rc.value = arr[cursor];
                if (fn(rc)) {
                    cursor++;
                    continue;
                }
                return rc;
            } while (true);
        },
        advanceUntillFalse(fn) {
            const rc = { done: false };
            do {
                if (cursor >= arr.length) {
                    rc.done = true;
                    rc.value = undefined;
                    return rc;
                }
                rc.value = arr[cursor];
                // peek
                cursor++;
                if (fn(rc)) {
                    continue;
                }
                return rc;
            } while (true);
        },
        stepBackWhileTrue(fn) {
            do {
                cursor = cursor > 0 ? cursor - 1 : 0;
                if (cursor === 0) return false;
                const rc = arr[cursor];
                if (fn(rc)) {
                    continue; // will step back one more time
                }
                break;
            } while (true);
        },
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
        },
        [Symbol.iterator]: function () {
            return this;
        }
    };
};
