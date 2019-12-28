
const { features } = require('./dictionary');
const { isArray } = Array;


features.set('any', {
    factory: 1,
    name: 'any',
    fn: a => {
        if (!isArray(a)) {
            throw new Error('"any" feature needs an array as configuration input');
        }
        if (a.length === 0) {
            throw new Error('trying to configure "any" feature with an non-empty array');
        }
        // all of the elements must be functions
        const errors = [];
        for (let i = 0; i < a.length; i++) {
            if (!(a[i] instanceof Function)) {
                errors.push(`"any" validator on index ${i} is not a callable function`);
            }
        }
        if (errors.length) {
            throw new Error(errors.join('|'));
        }
        // everything set to go
        return function checkAny(obj, ctx = { data: obj, location: [] }) {
            // loop over all posibilities untill you have a success
            for (const fn of a) {
                const [result, error] = fn(obj, ctx);
                if (!error) {
                    return [result, undefined];
                }
            }
            return [undefined, `none of the "any" set of validation functions approved the input`];
        };
    }
});
