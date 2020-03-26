const { features } = require('./dictionary');
const isObject = require('../isObject');

const {
    tokens
} = require('@mangos/jxpath/internals');

const formatPath = require('../jspath/format');

const isLenZero = require('../isLenZero');

function IfNotZeroLen(data){
    if (!isLenZero(data)){
        return data;
    }
}

features.set('object', {
    factory: 2,
    name: 'object',
    fn: function (schema) {
        // must be an object
        if (!isObject(schema)) {
            const errMsg = `specify a JS object with validators to verify an object`;
            throw new TypeError(errMsg);
        }
        const props = {
            strings: Object.getOwnPropertyNames(schema),
            symbols: Object.getOwnPropertySymbols(schema)
        };
        const propCount = props.strings.length + props.symbols.length;
        if (propCount === 0) {
            const errMsg = `the JS validator object does not have any properties defined`;
            throw new TypeError(errMsg);
        }
        const nonFunctions = props.strings.filter(f => typeof schema[f] !== 'function').concat(
            props.symbols.filter(f => typeof schema[f] !== 'function')
        );
        if (nonFunctions.length) {
            const errMsg = `the JS validator object does not have any properties defined`;
            throw new TypeError(errMsg);
        }
        // all ok with the object
        return function sealing(openOrClosed) {
            if (openOrClosed !== 'open' && openOrClosed !== 'closed') {
                const errMsg = `"object" validator must be finalized by "open" or "closed" modofifier, not with "${openOrClosed}"`;
                throw new TypeError(errMsg);
            }
           
            function checkMissingProps(partition, data, errors) {
                for (const key of props[partition]) {
                    if (!(key in data)) {
                        // could be optional, need to check now
                        // FIX it  here
                        const [,err,final] = schema[key](undefined);
                        if (!(final && !err)){ 
                            errors.push(`[${String(key)}] is manditory but absent from the object`);
                        }
                    }
                }
                return errors
            }

            function deepValidate(partition, data, ctx) {
                const errors = [];
                for (const key of props[partition]) {
                    const value = data[key];
                    if (value === undefined) { // it was optional
                        continue; // skip it
                    }
                    // clone the context
                    const ctxNew = { data: ctx.data, location: ctx.location.slice() };
                    ctxNew.location.push({ token: tokens.SLASH, value: '/' }, { token: tokens.PATHPART, value: key });
                    const [result, err] = schema[key](value, ctxNew);
                    if (!err) {
                        data[key] = isObject(result) ? result: result[0]; // allow for transforms
                        continue;
                    }
                    // error, we have to add the path info
                    if (Array.isArray(err)){
                        errors.push(...err);
                        continue;
                    }
                    if (!err.frozen){
                        errors.push(`object is frozen, validation error at path:${formatPath(ctxNew.location)}, error: ${err}`);
                        continue;
                    }
                    errors.push(err); // pass through
                }
                // process errors
                if (errors.length){
                    // are we nested object?
                    if (ctx.location.length){
                        return [undefined, IfNotZeroLen(errors), undefined];
                    }
                    return [undefined, IfNotZeroLen(errors), undefined];
                }
                return [data, undefined, undefined];
            }
            //
            return function validateObject(obj, ctx = { data: obj, location: [] }) { // Return dummy validator
                // validation for optional and missing props etc
                if (!isObject(obj)){
                    return [undefined, `data is not an object`];
                }
                const errors = [];
                
                if (openOrClosed === 'closed') {
                    for (const propKey in obj) {
                        if (!(propKey in schema)) {
                            errors.push(`${String(propKey)} this property is not allowed`);
                        }
                    }
                    if (errors.length) {
                        return [undefined, errors, undefined];
                    }
                }

                checkMissingProps('strings', obj, errors);
                checkMissingProps('symbols', obj, errors);

                if (errors.length) {
                    return [undefined, errors, undefined];
                }
                // deep validation
                const [result1, errors1] = deepValidate('strings', obj, ctx);
                if (errors1) {
                    return [undefined, errors1, undefined];
                }
                const [result2, errors2] = deepValidate('symbols', result1, ctx);
                if (errors2) {
                    return [undefined, errors2, undefined];
                }
                // all done
                return [[result2], undefined, undefined]
            }
        };
    }
});
