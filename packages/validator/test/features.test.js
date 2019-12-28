const chaiAsPromised = require('chai-as-promised');
const {
    describe,
    it,
    before,
    after
} = require('mocha');
const chai = require('chai');
chai.should();
chai.use(chaiAsPromised);
const {
    expect
} = chai;

const {
    V,
    addFeature,
    removeFeature
} = require('../src/proxy');

describe('features tests', function () {
    describe('ifFalsy', () => {
        it('correct replacement when value = "", 0, false, undefined, null', () => {
            const checker = V.ifFalsy('replace-with-this-string');
            const result = [0, '', false, undefined, null].map(v => checker(v));
            expect(result).to.deep.equal([['replace-with-this-string', undefined],
            ['replace-with-this-string', undefined],
            ['replace-with-this-string', undefined],
            ['replace-with-this-string', undefined],
            ['replace-with-this-string', undefined]]);
        });
        it('no replacement when value is "truethy"', () => {
            const checker = V.ifFalsy('replace-with-this-string');
            const result = [1, 'hi', true, {}].map(v => checker(v));
            expect(result).to.deep.equal([[1, undefined],
            ['hi', undefined],
            [true, undefined],
            [{}, undefined]]);
        });
    });
    describe('any', () => {
        const string = V.string(0, 50);
        const integer = V.integer(-5, 10);
        const object = V.object({ a: V.integer() }).closed;
        it('reject configuration thats not an array', () => {
            const checker = () => V.any(); // 
            expect(checker).to.throw('"any" feature needs an array as configuration input');
        });
        it('reject empty configuration array', () => {
            const checker = () => V.any([]); // 
            expect(checker).to.throw('trying to configure "any" feature with an non-empty array');
        });
        it('some array elements are not functions, should reject', () => {
            const checker = () => V.any([1, 2, 'he']); // 
            expect(checker).to.throw('"any" validator on index 0 is not a callable function|"any" validator on index 1 is not a callable function|"any" validator on index 2 is not a callable function');
        });
        it('match 0 validators in the set', () => {
            const checker = V.any([
                string, integer, object
            ]);
            const result = checker(28) // 
            expect(result).to.deep.equal([undefined, 'none of the "any" set of validation functions approved the input']);
        });
        it('match numeric validator in the set', () => {
            const checker = V.any([
                string, integer, object
            ]);
            const result = checker(9) // 
            expect(result).to.deep.equal([9, undefined]);
        });
        it('match object validator in the set', () => {
            const checker = V.any([
                string, integer, object
            ]);
            const result = checker({ a: 4 }) // 
            expect(result).to.deep.equal([{ a: 4 }, undefined]);
        });
        it('match object validator in the set', () => {
            const checker = V.object({
                person: V.object({ age: V.any([string, integer, object]) }).closed
            }).closed;
            const result = checker({ person: { age: 24 } }) // 
            expect(result).to.deep.equal([undefined,
                [{
                    frozen: true,
                    errorMsg: 'validation error at path:/person/age, error: none of the "any" set of validation functions approved the input'
                }],
                undefined]);
        });
    });
    describe('regexp', () => {
        it('check if a value is of type regexp', () => {
            const checker = V.regexp;
            const actualReg = /^$/g;
            const result = checker(actualReg);
            expect(result).to.deep.equal([actualReg, undefined]);
        });
        it('check if a value is NOT of type regexp', () => {
            const checker = V.regexp;
            const falseReg = 'some string';
            const result = checker(falseReg);
            expect(result).to.deep.equal([undefined, 'not a regexp']);
        });
    });
    describe('function', () => {
        const fun = (a, b, c) => { };
        it('check if it is a function type', () => {
            const result = V.function()(fun);
            expect(result).to.deep.equal([fun, undefined]);
        });
        it('invalidate a non function type', () => {
            const result = V.function()(class A { });
            expect(result).to.deep.equal([undefined, 'is not a function']);
        });
        it('invalidate a non function with wrong arguments', () => {
            const result = V.function(3)(function func1(a, b) { });
            expect(result).to.deep.equal([undefined, 'function [func1] does not have the required number of manditory arguments: 3']);
        });
        it('invalidate a anonymous function', () => {
            const result = V.function(3)((a, b) => { });
            expect(result).to.deep.equal([undefined, 'function [anonymous] does not have the required number of manditory arguments: 3']);
        });
    });
    describe('ref', () => {
        it('relative path, doesnt exist', () => {
            const data = {
                dictionary: {
                    states: ['TNx', 'CA']
                },
                firstName: 'Patrick',
                lastName: 'Bet-David',
                address: {
                    streetName: 'Kodak-Drive',
                    state: 'TN',
                    houseNr: 342,
                    appartment: '24A',
                    country: 'USA'
                }
            };

            const checkNAW = V.object({
                firstName: V.string(),
                lastName: V.string(),
                address: V.object({
                    streetName: V.string(),
                    state: V.string(0, 2).ref('../../dictionary/states').exist,
                    houseNr: V.integer(),
                    appartment: V.string(0, 3)
                }).open
            }).open;

            const result = checkNAW(data);
            expect(result).to.deep.equal([
                undefined,
                [{ frozen: true, errorMsg: 'validation error at path:/address/state, error: element "TN" could not be found at /dictionary/states' }], // array of errors
                undefined
            ]);
        });
        it('relative path, doesnt exist', () => {
            const data = {
                dictionary: {
                    states: ['TN', 'CA']
                },
                firstName: 'Patrick',
                lastName: 'Bet-David',
                address: {
                    streetName: 'Kodak-Drive',
                    state: 'TN',
                    houseNr: 342, // houseNr should be between 400 and 500
                    appartment: '24A' // error should be a string
                }
            };

            const checkNAW = V.object({
                firstName: V.string(),
                lastName: V.string(),
                address: V.object({
                    streetName: V.string(),
                    state: V.string(0, 2).ref('../../dictionary/states').exist,
                    houseNr: V.integer(),
                    appartment: V.string(0, 3)
                }).closed
            }).open;

            const result = checkNAW(data);
            expect(result).to.deep.equal([
                {
                    dictionary: { states: ['TN', 'CA'] },
                    firstName: 'Patrick',
                    lastName: 'Bet-David',
                    address:
                    {
                        streetName: 'Kodak-Drive',
                        state: 'TN',
                        houseNr: 342,
                        appartment: '24A'
                    }
                },
                undefined,
                undefined]);
        });

    });
    describe('string', () => {
        it('type check with implicit length check', () => {
            const checker = V.string();
            const [r1, err1] = checker('hello world');
            expect([r1, err1]).to.deep.equal(['hello world', null]);
        });
        it('type check with explicit length', () => {
            const checker = V.string(0, 10);
            const [r1, err1] = checker('123456789A'); // 10 chars
            expect([r1, err1]).to.deep.equal(['123456789A', null])
            const [r2, err2] = checker('123456789ABCF'); // 15 chars, should through error
            expect([r2, err2]).to.deep.equal([null, 'string of length:13 is not between 0 and 10 inclusive']);
            const [r3, err3] = checker(123456); // 15 chars, should through error
            expect([r3, err3]).to.deep.equal([null, 'value type is not of type string: number']);
        });
    });
    describe('boolean', () => {
        const checker = V.boolean;
        it('true', () => {
            expect(checker(true)).to.deep.equal([true, undefined]);
        });
        it('false', () => {
            expect(checker(false)).to.deep.equal([false, undefined]);
        });
        it('not a boolean but thruty', () => {
            expect(checker({})).to.deep.equal([undefined, 'not a boolean value:{}']);
        });
    });
    describe('number/integer', () => {
        it('number/integer faults', () => {
            const checker = V.number();
            const [r1, err1] = checker('hello world');
            expect([r1, err1]).to.deep.equal([null, 'hello world is not a number']);
            const checker2 = V.integer();
            const [r2, err2] = checker2(1.2);
            expect([r2, err2]).to.deep.equal([null, '1.2 is not an integer']);
        });
        it('number between a range', () => {
            const checker = V.number(-56, 99);
            const [r1, err1] = checker(-56.01);
            expect([r1, err1]).to.deep.equal([null, '-56.01 is not between -56 and 99 inclusive']);
            const [r2, err2] = checker(89);
            expect([r2, err2]).to.deep.equal([89, null]);
        });
        it('integer between a range', () => {
            const checker = V.integer(-56, 99);
            const [r1, err1] = checker(-56.01);
            expect([r1, err1]).to.deep.equal([null, '-56.01 is not an integer']);
            const [r2, err2] = checker(14);
            expect([r2, err2]).to.deep.equal([14, null]);
        });
        it('wrong range specification', () => {
            const checker = () => {
                V.integer(56, -99);
            };
            expect(checker).to.throw('lower boundery m:56 should be lower then upper boundery n:-99');
        });
    });
    describe('enum tests', () => {
        it('not finding a value in an enum list', () => {
            const fn = (a, b) => console.log('hello', a, b);
            const checker = V.enum([
                'blue', 'red', 'orange', fn, Symbol.for('honey')
            ]).optional;
            const v1 = checker('blue');
            expect(v1).to.deep.equal(['blue', undefined]);
            const v2 = checker(Symbol.for('honey'));
            expect(v2).to.deep.equal([Symbol.for('honey'), undefined]);
            const v3 = checker((a, b) => console.log('hello', a, b));
            expect(typeof v3[0]).to.equal('function');
            expect(v3[1]).to.be.undefined;
            const v4 = checker('cyan');
            expect(v4).to.deep.equal([undefined, '"cyan" not found in list']);
        });
    });
    describe('object tests', () => {
        it('empty schema object construction', () => {
            const checker = () => V.object({});
            expect(checker).to.throw('the JS validator object does not have any properties defined');
        });
        it('incomplete schema object construction', () => {
            const checker = () => V.object({
                a: V.number()
            })();
            expect(checker).to.throw('feature "object" has not been finalized');
        });
        it('nested object with errors in the leaf properties', () => {
            const data = {
                firstName: 'Patrick',
                lastName: 'Bet-David',
                address: {
                    streetName: 'Kodak-Drive',
                    state: 'TN',
                    houseNr: 342, // houseNr should be between 400 and 500
                    appartment: true // error should be a string
                }
            };

            const checkNAW = V.object({
                firstName: V.string(),
                lastName: V.string(),
                address: V.object({
                    streetName: V.string(),
                    state: V.string(0, 2),
                    houseNr: V.integer(400),
                    appartment: V.string(0, 3)
                }).closed
            }).closed;

            const result = checkNAW(data);
            expect(result).to.deep.equal([undefined,
                [{
                    frozen: true,
                    errorMsg: 'validation error at path:/address/houseNr, error: 342 is not between 400 and Infinity inclusive'
                },
                {
                    frozen: true,
                    errorMsg: 'validation error at path:/address/appartment, error: value type is not of type string: boolean'
                }],
                undefined]);
        });
        it('object with scalar properties some optional', () => {
            it('empty schema object construction', () => {
                const checker = () => V.object({});
                expect(checker).to.throw('the JS validator object does not have any properties defined');
            });

            const checker = V.object({
                id: V.integer(),
                name: V.string(0, 30).optional,
                lastName: V.string(0, 30)
            }).closed;

            const result = checker({
                id: 1234,
                name: 'Hans',
                lastName: 'Kazan'
            });
            expect(result).to.deep.equal([{
                id: 1234,
                name: 'Hans',
                lastName: 'Kazan'
            }, undefined, undefined]);

            const result2 = checker({
                id: 1234,
                name: 'Hans',
                lastName: 'Kazan',
                s: 'a' // should break because schema is closed
            });
            expect(result2).to.deep.equal([null, ['s this property is not allowed'], null]);

            const result3 = checker({
                id: 1234,
                lastName: 'Kazan'
            });

            expect(result3).to.deep.equal([{
                id: 1234,
                lastName: 'Kazan'
            }, undefined, undefined]);
            const result4 = checker({
                id: 1234
            });
            expect(result4).to.deep.equal([null,
                ['[lastName] is manditory but absent from the object'],
                null]);
        })
    })
});