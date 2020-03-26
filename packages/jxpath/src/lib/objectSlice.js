'use strict';

const {
    tokens
} = require('./tokenizer');
const isObject = o => typeof o === 'object' && o !== null && !Array.isArray(o);

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
    const [, firstPred, , secondPred,] = clauses;
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

function* objectSlice(opaque, iterator, parentFn = createParent(opaque, undefined), ignore) {

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
        yield opaque;
        return;
    }
    // absorb itslash and current
    if (instr.token === tokens.SLASH || instr.token === tokens.CURRENT) {
        const { value: value2, done: done2 } = iterator.advanceUntillFalse(p => p.value.token == tokens.SLASH || p.value.token === tokens.CURRECT)
        done = done2;
        instr = value2;
        if (done) {
            yield opaque;
            return;
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
            yield *objectSlice(opaque, iterator, parentFn, ignore);
            return;
        }
        return;
    }
    // pathpart
    if (instr.token === tokens.PATHPART) {
        if (isObject(opaque)) { // dive deeper
            if (!(instr.value in opaque)) {
                return;
            }
            const newOpaque = opaque[instr.value];
            if (Array.isArray(newOpaque)) {
                const pancaked = flatterMap(newOpaque);
                for (const opaqueSingle of pancaked) {
                    yield *objectSlice(opaqueSingle, iterator.fork(), createParent(opaque, parentFn), ignore);
                }
                return;
            }
            yield *objectSlice(newOpaque, iterator, createParent(opaque, parentFn), ignore);
            return;
        }
        return;
    }
    // parent
    // get the previours object and parentFn
    // pathpart
    if (instr.token === tokens.PARENT) {
        const {
            d,
            p
        } = parentFn();
        yield *objectSlice(d, iterator, p, ignore);
        return;
    }
    if (instr.token === tokens.RECURSIVE_DESCENT){
        if (!isObject(opaque)) { 
            return;
        }
        // absorb consequitive recursive descent tokens
        const { done: done2 } = iterator.advanceWhileTrue(p => p.value.token == tokens.SLASH || p.value.token === tokens.RECURSIVE_DESCENT)
        if (done2) {
            return; // blind recursive descent we dont do
        }
        const iterator2 = iterator.fork();
        iterator2.stepBackWhileTrue(p => p.value === tokens.SLASH || p.value.token !== tokens.RECURSIVE_DESCENT );
        
        yield *objectSlice(opaque, iterator, parentFn, ignore);
        // recursive descent
        for (const [propName, value] of Object.entries(opaque)){
            if (propName === ignore){
                continue;
            }
            if (isObject(value)){
                const iterator3 = iterator2.fork();
                yield *objectSlice(value, iterator3, createParent(value, parentFn), ignore); 
                continue;
            }
            if (Array.isArray(value)){
                for (const value2 of value){
                    const iterator3 = iterator2.fork();
                    yield *objectSlice(value2, iterator3, createParent(value2, parentFn), ignore);
                }
            }
        }
        return;
        
    }
    throw new Error(`token is invvalid ${JSON.stringify(instr)}`);
}

module.exports = objectSlice;