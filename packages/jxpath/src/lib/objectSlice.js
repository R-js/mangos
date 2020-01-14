const { tokens } = require('./tokenizer');
const isObject = o => typeof o === 'object' && o !== null && !Array.isArray(o);


/*
    PATHPART: '\x01',
    SLASH: '\x0f',
    PARENT: '\x03',
    CURRENT: '\x04',
    //PREDICATE: '\0x05',
    //PREDICATE_ELT: '\0x06',
    PREDICATE_ELT_REGEXP: '\0x07',
    PREDICATE_ELT_LITERAL: '\0x08'
*/

const predicates = { [tokens.PREDICATE_ELT_REGEXP]: 1, [tokens.PREDICATE_ELT_LITERAL]: 1 };

function createParent(object, prevParent) {
    return (n = 0) => {
        if (n === 0) return { d: object, p: prevParent };
        if (prevParent === undefined) return { d: object, p: prevParent }; // clamp this object as it is root
        return prevParent(n - 1);
    }
}

function approve(opaque, clauses) {
    const [cl1, cl2] = clauses;
    if (!isObject(opaque)) {
        return undefined;
    }
    const valueCollect = [];
    if (cl1.token === tokens.PREDICATE_ELT_LITERAL) {
        valueCollect.push(opaque[cl1.value]);
    }
    else {// can be more then one or 
        for (const [key, keyValue] of Object.entries(opaque)) {
            if (cl1.value.test(key)) {
                if (!isObject(keyValue)) {
                    valueCollect.push(keyValue);
                }
            }
        }
    }
    // second clause filters on key value
    if (cl2.token === tokens.PREDICATE_ELT_LITERAL) {
        if (valueCollect.includes(cl2.value)) {
            return opaque; // the object is selected
        }
        return undefined; // return nothing
    }
    else {
        for (const keyValue of valueCollect) {
            if (cl2.value.test(keyValue)) {
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

    const { value: instr, done } = iterator.next();
    if (done) {
        return [opaque];
    }
    // slash and current
    if (instr.token === tokens.SLASH || instr.token === tokens.CURRENT) {
        return objectSlice(opaque, iterator, parentFn);
    }
    // predicates 
    if (instr.token in predicates) {
        const clauses = [instr];
        while (true) {
            const { value: instr2, done: done2 } = iterator.next(p => p.value.token in predicates);
            if (done2) {
                break;
            }
            clauses.push(instr2);
        }
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
        const { d, p } = parentFn();
        return objectSlice(d, iterator, p);
    }
    throw new Error(`token is invvalid ${JSON.stringify(instr)}`);
}

module.exports = {
    objectSlice,
    createParent
};