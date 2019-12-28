const { features } = require('./dictionary');

const $optional = Symbol.for('optional');
const clone = require('clone');

const {
    tokens,
    formatPath
} = require('../jspath/tokenizer');

const ifArrayNotZero = require('../if-length-zero');

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
                        if (schema[key][$optional] === false) {
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
                    if (value === undefined) {
                        continue; // skip it
                    }
                    // clone the context
                    const ctxNew = { data: ctx.data, location: clone(ctx.location) };
                    ctxNew.location.push({ token: tokens.SLASH, value: '/' }, { token: tokens.PATHPART, value: key });
                    const [result, err, final] = schema[key](value, ctxNew);
                    if (!err) {
                        data[key] = result; // allow for transforms
                        continue;
                    }
                    // error, we have to add the path info
                    if (Array.isArray(err)){
                        errors.push(...err);
                        continue;
                    }
                    if (!err.frozen){
                        errors.push({ frozen:true, errorMsg:`validation error at path:${formatPath(ctxNew.location)}, error: ${err}`});
                        continue;
                    }
                    errors.push(err); // pass through
                }
                // process errors
                if (errors.length){
                    // are we nested object?
                    if (ctx.location.length){
                        return [undefined, ifArrayNotZero(errors), undefined];
                    }
                    return [undefined, ifArrayNotZero(errors), undefined];
                }
                return [data, undefined, undefined];
            }
            //
            return function validateObject(obj, ctx = { data: obj, location: [] }) { // Return dummy validator
                // validation for optional and missing props etc
                if (typeof obj !== 'object'){
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
                        return [null, errors, null];
                    }
                }

                checkMissingProps('strings', obj, errors);
                checkMissingProps('symbols', obj, errors);

                if (errors.length) {
                    return [null, errors, null];
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
                return [result2, undefined, undefined]
            }
        };
    }
});
