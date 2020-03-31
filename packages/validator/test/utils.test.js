const chaiAsPromised = require('chai-as-promised');
/*const {
    describe,
    it,
    //before,
    //after
} = require('mocha');*/
const chai = require('chai');
chai.should();
chai.use(chaiAsPromised);
const {
    expect
} = chai;

const convertToNumber = require('../src/convert2Number');
const convertToBoolean = require('../src/convert2Boolean');
const isStringArray = require('../src/isStringArray');
const isInt = require('../src/isInteger');
const isObject = require('../src/isObject');
const createStringLengthRangeCheck = require('../src/createStringLengthRangeCheck');
const checkNumberRange = require('../src/createRangeCheck');
const isBooleanArray = require('../src/isBooleanArray');
const isNumberArray = require('../src/isNumbersArray');
const { equals } = require('../src/equals');
const createFind = require('../src/createFind');


const {
    pathAbsorber
} = require('@mangos/jxpath/internals');

const resolve = require('../src/jspath/resolve');

describe.skip('utilities', function () {
    describe('resolve', () => {
        it('from "/p1/p2/p3/p4///p5/" to "../../n1/n2/./n5"', () => {
            const from = Array.from(pathAbsorber('/p1/p2/p3/p4///p5/'));
            const to = Array.from(pathAbsorber('../../n1/n2/./n5'));
            //     "/p1/p2/p3/n1/n2/n5"
            const res1 = resolve(from, to);
            expect(res1).to.deep.equal(
                [{ token: '\u000f', start: 0, end: 0, value: '/' },
                { token: '\u0001', start: 1, end: 2, value: 'p1' },
                { token: '\u000f', start: 3, end: 3, value: '/' },
                { token: '\u0001', start: 4, end: 5, value: 'p2' },
                { token: '\u000f', start: 6, end: 6, value: '/' },
                { token: '\u0001', start: 7, end: 8, value: 'p3' },
                { token: '\u000f', value: '/' },
                { token: '\u0001', start: 6, end: 7, value: 'n1' },
                { token: '\u000f', value: '/' },
                { token: '\u0001', start: 9, end: 10, value: 'n2' },
                { token: '\u000f', value: '/' },
                { token: '\u0001', start: 14, end: 15, value: 'n5' }]);
        });

        it('from "p1/p2/p3/p4///p5/" to "../../n1" should fail', () => {
            const from =  Array.from(pathAbsorber('p1/p2/p3/p4///p5/'));
            const to = Array.from(pathAbsorber('../../n1/n2/./n5'));
            expect(() => resolve(from, to)).to.throw('Internal error, object location path must be absolute');
        });

        it('from "/p1/p2/p3/p4///p5/" to "../../n1" should fail', () => {
            const from = Array.from(pathAbsorber('/p1/p2/p3/p4///p5/'));
            const to = Array.from(pathAbsorber('../../../../../n1'));
            const res1 = resolve(from, to);
            expect(res1).to.deep.equal(
                [{ token: '\u000f', value: '/' },
                { token: '\u0001', start: 15, end: 16, value: 'n1' }]);
        });
        it('from "" to "../../n1" should fail', () => {
            const from =  Array.from(pathAbsorber(''));
            const to =  Array.from(pathAbsorber('../../../n1'));
            expect(() => resolve(from, to)).to.throw('Internal error, object location path must be absolute');
        });
    });
    describe('find', () => {
        it('create find failure because of empty non array or empty list', () => {
            // below try catch is because nyc code coverage doesnt work with expect(()=>{...}).to.throw? why?
            try {
                createFind(undefined);
            } catch (err) {
                expect(err.message).to.equal('argument "objArr" needs to be an array');
            }
            try {
                createFind([]);
            } catch (err) {
                expect(err.message).to.equal('argument "objArr" cannot be an empty array');
            }

        });
        it('create find list of string, number and objects', () => {
            const find = createFind(['hello', 'world', 1]);
            const res1 = find(1); // [1, undefined]
            expect(res1).to.deep.equal([[1], undefined]);
            const res2 = find({}); // [undefined, not found]
            expect(res2).to.deep.equal([undefined, '"[object Object]" not found in list']);
        });
        it('create find function to find non-scalar values', () => {
            const find = createFind([{
                'hello': 'world'
            },
            [
                1,
                2,
                4,
                5,
                'nada',
                undefined,
                null,
                {}
            ],
                undefined,
                null
            ]);
            const res1 = find({
                hello: 'world'
            }); // [1, undefined]
            expect(res1).to.deep.equal([[{
                hello: 'world'
            }], undefined]);
            const res2 = find(null);
            expect(res2).to.deep.equal([[null], undefined]);
            const res3 = find(undefined);
            expect(res3).to.deep.equal([[undefined], undefined]);
            const res3a = find();
            expect(res3a).to.deep.equal([[undefined], undefined]);
            const res4 = find([
                1,
                2,
                4,
                5,
                'nadax',
                undefined,
                undefined
            ]);
            expect(res4).to.deep.equal([undefined, '"1,2,4,5,nadax,," not found in list'])
            const res5 = find([
                1,
                2,
                4,
                {},
                5,
                'nada',
                undefined,
                null
            ]);
            expect(res5).to.deep.equal([[
                [
                    1,
                    2,
                    4,
                    {},
                    5,
                    'nada',
                    undefined,
                    null
                ]], undefined
            ]);

        });
    });
    describe('isObject  tests', () => {
        it('isObject', () => {
            const data = [{}, undefined, undefined, new Date, []];
            expect(isObject(data[0])).to.be.true;
            expect(isObject(data[1])).to.be.false;
            expect(isObject(data[2])).to.be.false;
            expect(isObject(data[3])).to.be.true;
            expect(isObject(data[4])).to.be.false;
        });
    });
    describe('equals', () => {
        it('compare strings', () => {
            const result1 = equals('string1', 'string2');
            const result2 = equals('same', 'same');
            expect(result1).to.be.false;
            expect(result2).to.be.true;
        });
        it('compare numbers', () => {
            const result1 = equals(1, 2);
            const result2 = equals(123.4, 123.4);
            expect(result1).to.be.false;
            expect(result2).to.be.true;
        });
        it('compare Symbols', () => {
            const result1 = equals(Symbol.for('1'), Symbol.for('@'));
            const result2 = equals(Symbol.for('something'), Symbol.for('something'));
            expect(result1).to.be.false;
            expect(result2).to.be.true;
        });
        it('compare booleans', () => {
            const result1 = equals(true, false);
            const result2 = equals(false, false);
            expect(result1).to.be.false;
            expect(result2).to.be.true;
        });
        it('compare undefineds', () => {
            const result1 = equals(undefined, null);
            const result2 = equals(undefined, undefined);
            expect(result1).to.be.false;
            expect(result2).to.be.true;
        });
        it('compare objects', () => {
            const result1 = equals({}, {});
            expect(result1).to.be.true;
            const result2 = equals({
                a: '2'
            }, {
                a: '2'
            });
            expect(result2).to.be.true;
            const result3 = equals({
                a: '2',
                b: {
                    c: Symbol.for('v')
                }
            }, {
                a: '2',
                b: {
                    c: Symbol.for('v')
                }
            });
            expect(result3).to.be.true;
            const result4 = equals({
                a: '2',
                b: {
                    c: Symbol.for('v')
                }
            }, {
                a: '2',
                b: {
                    c: Symbol.for('v2')
                }
            });
            expect(result4).to.be.false;
            const result5 = equals({}, {
                a: '2',
                b: {
                    c: Symbol.for('v2')
                }
            });
            expect(result5).to.be.false;
            const result6 = equals({
                a: '2',
                b: {
                    c: Symbol.for('v2')
                }
            }, {
                c: '2',
                b: {
                    c: Symbol.for('v2')
                }
            });
            expect(result6).to.be.false;
            const result7 = equals({
                [Symbol.for('a')]: '2'
            }, {
                [Symbol.for('c')]: '2'
            });
            expect(result7).to.be.false;
        });
        it('compare arrays', () => {
            const result1 = equals([], []);
            const result2 = equals([3, 5], [5, 3]);
            const result3 = equals([3, 3, 5], [5, 3, 3]);
            const result4 = equals([3, 3, 5], [5, 5, 3]);
            expect(result1).to.be.true;
            expect(result2).to.be.true;
            expect(result3).to.be.true;
            expect(result4).to.be.false;
        });
        it('compare ECMAScript 2015 classes', () => {
            const cla = class A { constructor() { this.v1 = 1 } };
            const clb = class A { constructor() { this.v1 = 1 } };
            const clc = class A { constructor() { this.v1 = 2 } };
            expect(equals(cla, clb)).to.be.true;
            expect(equals(cla, clc)).to.be.false;
        });
    });
    describe('scalar tests', () => {
        it('isInteger', () => {
            expect(isInt(1)).to.deep.equal([1, undefined]);
            expect(isInt(1.4)).to.deep.equal([undefined, 'not an integer']);
            expect(isInt(-Infinity)).to.deep.equal([undefined, 'not an integer']);
            expect(isInt({})).to.deep.equal([undefined, 'not a number']);
        });
        it('createStringLengthRangeCheck', () => {
            expect(() => createStringLengthRangeCheck(-1, 12)).to.throw('lower boundery m:-1 should be >= 0');
            expect(() => createStringLengthRangeCheck(4, 2)).to.throw('lower boundery m:4 should be lower then upper boundery n:2');
            expect(() => createStringLengthRangeCheck('4', 2)).to.throw('lower boundery m:<string>4 MUST be of type number');
            expect(() => createStringLengthRangeCheck(4, '2')).to.throw('upper boundery n:<string>2 MUST be of type number');
            expect(() => createStringLengthRangeCheck(NaN, 2)).to.throw('lower boundery m is a NaN');
            expect(() => createStringLengthRangeCheck(4, NaN)).to.throw('upper boundery n is a NaN');
            const checker = createStringLengthRangeCheck(2, 10);
            const result1 = checker('some string longer the 10 chars');
            expect(result1).to.deep.equal([undefined, 'string of length:31 is not between 2 and 10 inclusive']);
            const result2 = checker('x'); // to short
            expect(result2).to.deep.equal([undefined, 'string of length:1 is not between 2 and 10 inclusive']);
            const [result3, err3] = checker('hello');
            expect(result3).to.deep.equal(['hello']);
            expect(err3).to.be.undefined;
        });
        it('createRangeCheck', () => {
            const createRangeCheck = checkNumberRange(false);
            const checker = createRangeCheck(1, 2);
            const result1 = checker(34);
            expect(result1).to.deep.equal([undefined, '34 is not between 1 and 2 inclusive']);
            const result2 = checker(1.2);
            expect(result2).to.deep.equal([[1.2], undefined]);
            expect(() => createRangeCheck(4, 2)).to.throw('lower boundery m:4 should be lower then upper boundery n:2');
            expect(() => createRangeCheck('1', 2)).to.throw('lower boundery m:<string>1 MUST be of type number');
            expect(() => createRangeCheck(1, '2')).to.throw('upper boundery n:<string>2 MUST be of type number');
            expect(() => createRangeCheck(NaN, 100)).to.throw('lower boundery m is a NaN');
            expect(() => createRangeCheck(0, NaN)).to.throw('upper boundery n is a NaN');
        });
    })
    describe('type conversions', () => {
        it('conversion to number', () => {
            const data = ['34234', 'xxEAZE', 4234];
            expect(convertToNumber(data[0])).to.deep.equal([34234, undefined]);
            expect(convertToNumber(data[1])).to.deep.equal([undefined, 'cannot convert to number']);
            expect(convertToNumber(data[2])).to.deep.equal([4234, undefined]);
        });
        describe('conversion to boolean', () => {
            const data = [{
                in: 'true',
                out: [true, undefined]
            },
            {
                in: 'TrUE',
                out: [true, undefined]
            },
            {
                in: 'False',
                out: [false, undefined]
            },
            {
                in: 'Falsex',
                out: [undefined, 'cannot convert to boolean']
            },
            {
                in: false,
                out: [false, undefined]
            },
            {
                in: true,
                out: [true, undefined]
            },
            {
                in: undefined,
                out: [undefined, 'cannot convert to boolean for other then string type']
            }
            ];
            for (const elt of data) {
                const msg = elt.out[1] ? `convert ${elt.in} to boolean should result in error` : `convert ${elt.in} to boolean should succeed`;
                it(msg, () => {
                    const input = elt.in; // copy value from closure, because changed in next iteration
                    const output = elt.out;
                    const act = convertToBoolean(input);
                    expect(act).to.deep.equal(output);
                });
            }
        });
    });
    describe('helpers', () => {
        describe('isStringArray', () => {
            it('non array', () => {
                const [arr, err] = isStringArray({
                    a: 1
                });
                expect(arr).to.be.undefined;
                expect(err).to.equal('collection is not a array [object Object]');
            });
            it('empty array', () => {
                const [arr, err] = isStringArray([]);
                expect(arr).to.be.undefined;
                expect(err).to.equal('collection is not an empty array');
            });
            it('array of strings', () => {
                const data = ['a string', 'i like startrek'];
                const [arr, err] = isStringArray(data);
                expect(err).to.be.undefined;
                expect(arr).to.deep.equal(data);
            });
            it('array of non strings', () => {
                const data = [1, Symbol.for('zup'), true, 'a string', 'i like startrek'];
                const [arr, err] = isStringArray(data);
                expect(arr).to.be.undefined;
                expect(err).equal('not all elements were strings');
            });
        });
        describe('isNumberArray', () => {
            it('empty array test', () => {
                const [arr, err] = isNumberArray([]);
                expect(arr).to.be.undefined;
                expect(err).to.equal('collection is not an empty array');
            });
            it('array of numbers', () => {
                const data = [1, 334, 2345, NaN, Infinity];
                const [arr, err] = isNumberArray(data);
                expect(err).to.be.undefined;
                expect(arr).to.deep.equal(data);
            });
        });
        describe('isBooleanArray', () => {
            it('empty array test', () => {
                const [arr, err] = isBooleanArray([]);
                expect(arr).to.be.undefined;
                expect(err).to.equal('collection is not an empty array');
            });
            it('array of booleans', () => {
                const data = [false, true];
                const [arr, err] = isBooleanArray(data);
                expect(err).to.be.undefined;
                expect(arr).to.deep.equal(data);
            });
        });
    })
});