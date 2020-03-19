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
    Symbol.for('nodejs.util.inspect.custom'), // mm
];

const isObject = require('./isObject');


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

function sink() {
    return undefined;
}

function err() {
    return new TypeError(`you cannot do that with this object`);
}

/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy

handler.getPrototypeOf()
A trap for Object.getPrototypeOf.
handler.setPrototypeOf()
A trap for Object.setPrototypeOf.
handler.isExtensible()
A trap for Object.isExtensible.
handler.preventExtensions()
A trap for Object.preventExtensions.
handler.getOwnPropertyDescriptor()
A trap for Object.getOwnPropertyDescriptor.
handler.defineProperty()
A trap for Object.defineProperty.
handler.has()
A trap for the in operator.
handler.get()
A trap for getting property values.
handler.set()
A trap for setting property values.
handler.deleteProperty()
A trap for the delete operator.
handler.ownKeys()
A trap for Object.getOwnPropertyNames and Object.getOwnPropertySymbols.
handler.apply()
A trap for a function call.
handler.construct()
A trap for the new operator.
*/

function defaultHandler() {
    return {
        getPrototypeOf: () => { }, //there is no prototype
        setPrototypeOf: () => false, // cannot set prototype
        isExtensible: () => false, // not extendable
        preventExtensions: () => true, // prevent extensions
        getOwnPropertyDescriptor: () => undefined, // no property descriptor in format {...}
        defineProperty: () => false,// definitions always fail, in strict mode will throw a TypedError exception
        has: () => false, // has no properties via "in"
        get: () => undefined, // "override" most likely
        set: () => false, // setting failed and in strict mode will though prototype exception
        deleteProperty: () => false, // deletions not possible
        ownKeys: () => [], // no keys
        apply: () => { throw new TypeError(`Validator not finalized`); }, // "override" most likely
        construct: () => { } // return emoty object
    };
}


// the the validator is finalized and only needs to be called
function onlyCall(prevProxy) {
    const proto = defaultHandler();
    const onlyCall = Object.assign(proto, {
        apply: function (target /* the primer, or fn in the chain */, thisArg /* the proxy object */, argumentList) {
            // "only call" the call sequence it is reversed
            let [data, err, sortcircuitfinal] = target(...argumentList);
            if (err || sortcircuitfinal) { // immediatly stop
                return [data, err, sortcircuitfinal];
            }
            return prevProxy(...argumentList); // call up the chain first
        }
    });
    return onlyCall;
}

function selectOrCall(prevProxy) { // people can still add optional to this!!
    const proto = defaultHandler();
    const selectOrCallingHandler = Object.assign(proto, {
        apply: function (target /* the primer, or fn in the chain */, thisArg /* the proxy object */, argumentList) {
            if (prevProxy) {
                const [data, err, final] = prevProxy(...argumentList); // call up the chain first
                if (err || final) { // imediatly stop
                    return [data, err || null, final || null];
                }
            }
            throw new TypeError(`you didnt not specify any features for this validator`);
        },
        get: function (target , prop, receiver) {
            const found = features.get(prop);
            if (!found) {
                const erMsg = `[${String(prop)}] <- this feature is unknown`;
                throw new TypeError(erMsg);
            }
            const { factory, name, fn, final } = found;
            if (factory > 0) {
                const o = { factory, name, fn };
                return new Proxy(target, construct(o, prevProxy));
            }
            if (final) { // there 
                if (prevProxy){                
                    return new Proxy(fn, onlyCall(receiver));
                }
                throw new TypeError(`finalizing validators like ${prop} cannot be used by themselves`);
            }
            return new Proxy(found.fn, selectOrCall(receiver));
        }
    });
    return selectOrCallingHandler;
}

function construct(propContext, prevProxy) {
    const proto = defaultHandler();
    const constructionHandler = Object.assign(proto, {
        get: function (target /**/, prop, receiver /* Proxy */) {
            propContext.fn = propContext.fn(prop); // this could throw
            propContext.factory--;
            if (propContext.factory === 0) {
                return new Proxy(propContext.fn, selectOrCall(prevProxy)); //  //passon the prev prxyif the construction is done, so the handler must be select or call
            }
            return receiver; // not done yet
        }
    });
    return constructionHandler;
}

// how to implement optional, well optional should be the first call


function createValidatorFactory() {
    const primer = () => {};
    const handler = selectOrCall();
    return new Proxy(primer, handler);
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