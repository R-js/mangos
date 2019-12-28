'use strict';
const { features } = require('./dictionary');
const { isArray } = Array;


features.set('any', {
    factory: 1,
    name: 'any',
    fn: a => {
        if (isArray(a) && a.length === 0) {
            throw new Error('trying to configure "any" feature with an empty array');
        }
        // all of the elements must be functions
        const validators = isArray(a) ? a: [a];
        const errors = [];
        for (let i = 0; i < validators.length; i++) {
            if (!(validators[i] instanceof Function)) {
                errors.push(`"any" validator on index ${i} is not a callable function`);
            }
        }
        if (errors.length) {
            throw new Error('\n|'+errors.join('\n|')+'\n');
        }
        // everything set to go
        return function checkAny(obj, ctx = { data: obj, location: [] }) {
            // loop over all posibilities untill you have a success
            const idaat = Array.isArray(obj) ?  obj : [obj];
            for (let i = 0; i < idaat.length; i++){
                let itmValid = false;
                for (const validator of validators) {
                    const [result, error] = validator(idaat[i], ctx);
                    if (!error) {
                        idaat[i] = result;
                        itmValid = true;
                        break;
                    }
                }
                if (!itmValid){
                    return [ undefined, idaat.length === 1 ? 'none of the "any" set of validation functions approved the input':
                            `array element at index: ${i} failed any validation`];        
                } 
            }
            // all was ok
            return [ idaat.length === 1 ? obj : idaat[0], undefined ];
        };
    }
});
