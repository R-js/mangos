'use strict';
const clone = require('clone');
const { features } = require('./features/dictionary');
const $optional = Symbol.for('optional');
const $marker = Symbol.for('ladybug');
function primer() {
    /* noop primer  */
    throw new TypeError(`Internal Error: you reached a dead-stop function, please file this Error on as an issue on github: `)
}

const excludeSymbols = [
    Symbol.for('nodejs.util.inspect.custom'),
];

require('./features/boolean');
require('./features/object');
require('./features/range');
require('./features/string');
require('./features/number');
require('./features/integer');
require('./features/enum');
require('./features/ref');
require('./features/function');
require('./features/regexp');
require('./features/any');
require('./features/ifFalsy');

function createValidatorFactory() {
    function createHandler(propContext, parentAssembler) {
        let optional = false;
        const handler = Object.freeze({
            get: function (target /* the primer, or fn in the chain */, prop, receiver /* Proxy */) {
                // completling partials
                if (propContext && propContext.factory) {
                    propContext.fn = propContext.fn(prop); // this could throw
                    propContext.factory--;
                    if (propContext.factory === 0) {
                        const assembly = new Proxy(propContext.fn, createHandler(undefined, parentAssembler /*dont use reciver*/)); // skip the isolated chain where we finalized a curried function
                        propContext = undefined;
                        return assembly;
                    }
                    return receiver;
                }
                if (propContext && propContext.factory === 0) {
                    const erMsg = `[${propContext.name}] <- this feature is not fully configured, call it as a function (with or without arguments as needed)`;
                    throw new TypeError(erMsg);
                }
                if (prop === Symbol.toPrimitive) {
                    return this[prop];
                }
                if (excludeSymbols.includes(prop)) {
                    return undefined;
                }
                if (prop === $optional) {
                    return optional;
                }
                if (optional) { // closed!!
                    throw new TypeError(`this validator has been finalized, extend with property "internal"`);
                }
                if (prop === 'optional' && parentAssembler === undefined) {
                    throw new TypeError(`to early to specify "optional" marker, there is no validator`);
                }
                // this is akin to setting it
                if (prop === 'optional' && optional === false) {
                    optional = true;
                    return receiver;
                }
                const found = features.get(prop);
                if (!found) {
                    const erMsg = `[${String(prop)}] <- this validator feature is unknown`;
                    throw new TypeError(erMsg);
                }
                if (found.factory > 0) {
                    return new Proxy(primer /*use dummy just in case*/, createHandler(clone(found), parentAssembler || receiver));
                    // V.object({..., a:V.hello, ...});
                    // V.object
                }
                // this validator needs no constructing
                return new Proxy(found.fn, createHandler(this, receiver)); // create parent-child-chain of handlers for callback
            },
            set: function () {
                throw new TypeError(`cannot use assignment in this context`);
            },
            apply: function (target /* the primer, or fn in the chain */, thisArg /* the proxy object */, argumentList) {
                // finalizing a feature via completing calling the curried function
                if (propContext && propContext.factory > 0) {
                    if (thisArg === undefined){
                        throw new TypeError(`feature "${propContext.name}" has not been finalized`);
                    }
                    const temp = {
                        ...propContext,
                        fn: propContext.fn(...argumentList) // this can throw!!
                    };
                    Object.assign(propContext, temp);
                    propContext.factory--;
                    if (propContext.factory > 0) {
                        return new Proxy(temp.fn, createHandler(propContext, parentAssembler || thisarg)); //not done yet with finalizing
                    }
                    const assembly = new Proxy(temp.fn, createHandler(undefined, parentAssembler || thisArg)); // create parent-child-chain of handlers for callback
                    return assembly;
                }
                //
                // actual calling the validator
                //
                if (parentAssembler === rootAssembler) {
                    return target(...argumentList); // for debugging a seperate rc
                }
                const [data, err, final] = parentAssembler(...argumentList);
                if (err || final) { // imediatly stop
                    return [data, err || null, final || null];
                }
                const result2 = target(...argumentList);
                return result2;
                //}
            },
            [Symbol.toPrimitive]: function ( /*hint*/) {
                return 'Object [validator]'; // TODO: replace this string by a usefull DAG
            },
            [$marker]: true
        });
        return handler;
    }
    // bootstrap
    const rootAssembler = new Proxy(primer, createHandler());
    /* maybe do some tests here */
    return rootAssembler;
}

function addFeature(feature) {
    // check the options,
    if (!isObject(feature)) {
        throw new TypeError(`feature should be a js object`);
    }
    if (typeof feature.name !== 'string') {
        throw new TypeError(`feature must have name of type string`);
    }
    // names are restructed javascript var names [0-1A-Za-z$_]
    if (/^[0-1A-Za-z$_]+$/.test(feature.name)) {
        throw new TypeError(`"name" value must be a string naming a javascript identifier`);
    }
    feature.factory = feature.factory || 0;
    if (feature.factory) {
        if (typeof feature.factory !== 'number') {
            throw new TypeError(`"factory" property wants `);
        }
    }
    if (typeof feature.fn !== 'function') {
        throw new TypeError(`"fn" is missing you must specify a validator function`);
    }
    // all typechecks ok
    if (features.has(feature.name)) {
        throw new TypeError(`a feature with the name ${feature.name} is already registered, register under a different name`);
    }
    features.set(feature.name, feature);
    return true;
}

function removeFeature(featureName) {
    return features.delete(featureName);
}

module.exports = { V: createValidatorFactory(), addFeature, removeFeature };
