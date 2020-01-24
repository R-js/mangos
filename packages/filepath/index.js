const os = require('os');

const {
    posixAbsorber,
    tdpAbsorber,
    uncAbsorber,
    ddpAbsorber
} = require('./lib/tokenizer');


function filterErr(t) {
    return v.error !== undefined
}

function createPathProcessor(path) {
    return function (ns, absorber) {
        const rc = {};
        const tokens = Array.from(absorber(path));
        if (tokens.length === 0) {
            return rc;
        }
        rc[ns].path = tokens;
        const firstError = tokens.find(filterErr);
        if (firstError) {
            rc[ns].firstError = firstError;
        }
        return rc;
    }
}


function currentCWD() {
    const path = process.cwd();
    const platform = require('os').platform()

}

function resolve(_from, to) {
    if (_from.length === 0 && to.length === 0) {
        // return current working dir of the process
    }
    if (to[0].token in rootTokens) {
        return clone(to);
    }
    // to is not root
    // if "_from" is not root you need to resolve it with current process.cwd
    if (!(_from[0].token in rootTokens)) {
        const possibilities = evaluate(process.cwd());
        console.log(possibilities);
    }
}

const absorberMapping = {
    unc: uncAbsorber,
    dos: tdpAbsorber,
    devicePath: ddpAbsorber,
    posix: posixAbsorber
}

const allNamespaces = ['unc', 'dos', 'devicePath', 'posix'];


function evaluate(path, options = {}) {
    if (Object.keys(options).filter(f => allNamespaces.includes(k)).length === 0) {
        Object.assign(options, {
            unc: os.platform() === 'win32',
            dos: os.platform() === 'win32',
            devicePath: os.platform() === 'win32',
            posix: os.platform() !== 'win32'
        });
    }
    const rc = {};
    const processor = createPathProcessor(path);

    for (const [ns, ok] of Object.entries(options)) {
        if (!ok) {
            continue;
        }
        const result = processor(ns, absorberMapping[ns]);
        Object.assign(rc, result);
    }
    return rc;
}

modules.export = {
    evaluate,
    resolve
}