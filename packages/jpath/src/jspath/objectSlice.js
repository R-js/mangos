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

function getValue(object, selector, cursor) {
    const instr = selector[cursor];
    if (!(instr.token in predicates)) {
        return object[instr.value];
    }
    const clauses = [];
    while (cursor < selector.length && selector[cursor].token in predicates) {
        clauses.push(selector[cursor]);
        cursor++;
    }
    // first clause is a property-name clause
    const cl1 = clauses[0];
    const valueCollect = [];
    if (cl1.token === tokens.PREDICATE_ELT_LITERAL) {
        valueCollect.push(object[cl1.value]);
    }
    else {// can be more then one or 
        for (const [key, keyValue] of Object.entries(object)) {
            if (cl1.value.test(key)) {
                if (!isObject(keyValue)) {
                    valueCollect.push(keyValue);
                }
            }
        }
    }
    const cl2 = clauses[1];
    // second clause filters on key value
    if (cl2.token === tokens.PREDICATE_ELT_LITERAL) {
        if (valueCollect.includes(cl2.value)) {
            return object; // the object is selected
        }
        return undefined; // return nothing
    }
    else {
        for (const keyValue of valueCollect) {
            if (cl2.value.test(keyValue)) {
                return object;
            }
        }
        return undefined;
    }
}

function step(selector, cursor) {
    const instr = selector[cursor];
    if (!(instr.token in predicates)) {
        return cursor + 1;
    }
    while (cursor < selector.length && selector[cursor].token in predicates) {
        cursor++;
    }
    return cursor;
}

function objectSlice(object, selector, cursor = 0, parent) {
    if (selector.length === cursor) {
        return [object];
    }
    const rc = [];
    const instr = selector[cursor];
    const next = step(selector, cursor);
    switch (instr.token) {
        case tokens.PARENT:
            if (parent !== undefined) {
                const { d: parentNode, p: prevParentFn } = parent();
                const rcSub = objectSlice(parentNode, selector, next, prevParentFn);
                rc.push(...rcSub);
                break;
            }
            else {
                const rcSub = objectSlice(object, selector, next, parent);
                rc.push(...rcSub);
            }
            break;
        // fall through
        case tokens.CURRENT:
        case tokens.SLASH:
            const rcSub = objectSlice(object, selector, next, parent);
            rc.push(...rcSub);
            break;
        case tokens.PREDICATE_ELT_REGEXP:
        case tokens.PREDICATE_ELT_LITERAL:
        case tokens.PATHPART:
            const value = getValue(object, selector, cursor);
            if (value === undefined) {
                break;
            }
            if (Array.isArray(value)) {
                if (cursor === selector.length - 1) { // performance enhancement
                    rc.push(...value);
                    break;
                }
                for (const item of value) {
                    const _parent = (instr.token in predicates) ? (parent ? parent(0).p : undefined) : createParent(item, parent);
                    const rcSub = objectSlice(item, selector, next, _parent);
                    rc.push(...rcSub);
                }
                break;
            }
            if (isObject(value)) {
                const _parent = (instr.token in predicates) ? (parent ? parent(0).p : undefined) : createParent(value, parent);
                const rcSub = objectSlice(value, selector, next, _parent);
                rc.push(...rcSub);
                break;
            }
            // here we use optional clauses or not
            // should we add this value?
            if (cursor === selector.length - 1) { // performance enhancement
                rc.push(value);
            }
            break;
        default:
            throw new TypeError(`selector is an incorrect token ${JSON.stringify(instr)}`);
    }
    return rc;
}

module.exports = {
    objectSlice,
    createParent
};
