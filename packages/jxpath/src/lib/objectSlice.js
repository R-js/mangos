const {
    tokens
} = require('./tokenizer');
const isObject = o => typeof o === 'object' && o !== null && !Array.isArray(o);

/*
    PATHPART: '\x01',
    SLASH: '\x0f',
    PARENT: '\x03',
    CURRENT: '\x04',
    PREDICATE_ELT_REGEXP: '\0x07',
    PREDICATE_ELT_LITERAL: '\0x08',
    EQUAL_TOKEN: '\0x09',
    BRACKET_OPEN: '\0x0a',
    BRACKET_CLOSE: '\0x0b',
*/

const predicates = {
    [tokens.BRACKET_CLOSE]: 1,
    [tokens.BRACKET_OPEN]: 1,
    [tokens.EQUAL_TOKEN]: 1,
    [tokens.PREDICATE_ELT_LITERAL]: 1,
    [tokens.PREDICATE_ELT_REGEXP]: 1
};

function createParent(object, prevParent) {
    return (n = 0) => {
        if (n === 0) return {
            d: object,
            p: prevParent
        };
        if (prevParent === undefined) return {
            d: object,
            p: prevParent
        }; // clamp this object as it is root
        return prevParent(n - 1);
    }
}

function approve(opaque, clauses) {
    const [, firstPred, , secondPred, ]  = clauses;
    if (!isObject(opaque)) {
        return undefined;
    }
    const valueCollect = [];
    if (firstPred.token === tokens.PREDICATE_ELT_LITERAL) {
        valueCollect.push(opaque[firstPred.value]);
    } else { // can be more then one or 
        for (const [key, keyValue] of Object.entries(opaque)) {
            if (firstPred.value.test(key)) {
                if (!isObject(keyValue)) {
                    valueCollect.push(keyValue);
                }
            }
        }
    }
    // second clause filters on key value
    if (secondPred.token === tokens.PREDICATE_ELT_LITERAL) {
        if (valueCollect.includes(secondPred.value)) {
            return opaque; // the object is selected
        }
        return undefined; // return nothing
    } else {
        for (const keyValue of valueCollect) {
            if (secondPred.value.test(keyValue)) {
                return opaque;
            }
        }
        return undefined;
    }
}

function flatterMap(array) {
    const result = [];
    for (const item of array) {
        if (Array.isArray(item)) {
            result.push(...flatterMap(item));
            continue;
        }
        result.push(item);
    }
    return result;
}

function objectSlice(opaque, iterator, parentFn = createParent(opaque, undefined)) {

    let instr;
    let done; {
        const {
            value,
            done: done2
        } = iterator.next();
        instr = value;
        done = done2;
    }
    if (done) {
        return [opaque];
    }
    // absorb itslash and current
    if (instr.token === tokens.SLASH || instr.token === tokens.CURRENT) {
        while (true) {
            const {
                done: done2
            } = iterator.next(p => p.value.token === tokens.SLASH || instr.token === tokens.CURRENT);
            if (done2) {
                break;
            }
        } {
            const {
                value,
                done: done2
            } = iterator.next();
            instr = value;
            done = done2;
        }
    }
    // predicates 
    if (instr.token in predicates) {
        const clauses = [];
        clauses.push(instr);
        while (true) {
            const {
                value: instr2,
                done: done2
            } = iterator.next(p => {
                if (p.value.token in predicates) {
                    return true;
                }
                return false;
            });
            if (done2) {
                break;
            }
            clauses.push(instr2);
        }
        // test for errors, if errors basicly throw errors
        if (approve(opaque, clauses)) {
            return objectSlice(opaque, iterator, parentFn);
        }
        return [];
    }
    // pathpart
    if (instr.token === tokens.PATHPART) {
        if (isObject(opaque)) { // dive deeper
            if (!(instr.value in opaque)) {
                return [];
            }
            const newOpaque = opaque[instr.value];
            if (Array.isArray(newOpaque)) {
                const pancaked = flatterMap(newOpaque);
                const collect = [];
                for (opaqueSingle of pancaked) {
                    const rcSub = objectSlice(opaqueSingle, iterator.fork(), createParent(opaque, parentFn));
                    collect.push(...rcSub);
                }
                return collect;
            }
            return objectSlice(newOpaque, iterator, createParent(opaque, parentFn));
        }
        return [];
    }
    // parent
    // get the previours object and parentFn
    // pathpart
    if (instr.token === tokens.PARENT) {
        const {
            d,
            p
        } = parentFn();
        return objectSlice(d, iterator, p);
    }
    throw new Error(`token is invvalid ${JSON.stringify(instr)}`);
}

module.exports = {
    objectSlice,
    createParent
};