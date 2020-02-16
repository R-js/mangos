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
    predicateElementTokenizer,
    predicateTokenizer,
    defaultTokenizer,
    getTokens,
    regExpSafe,
    absorbLExpPredicate,
    absorbRExpPredicate,
    predicateRegExpAbsorber,
    predicateHolisticAbsorber,
    pathEltAbsorber,
    pathAbsorber
} = require('../src/lib/tokenizer');

const {
    from: arr
} = Array;

describe('lexer', () => {
    describe('new stuff', () => {
        describe('regExpSafe', () => {
            it('\\', () => {
                const a1 = regExpSafe('\\');
                expect(a1).to.be.undefined;
            });
            it('^[a-z]+$', () => {
                const a2 = regExpSafe('^[a-z]+$');
                expect(a2.toString()).to.equal('/^[a-z]+$/');
            });
        });
        describe('predicateRegExpAbsorber', () => {

            it('/^[a-z]+$/', () => {
                const a1 = Array.from(predicateRegExpAbsorber('/^[a-z]+$/'));
                expect(a1).to.deep.equal([{ start: 0, end: 9, value: /^[a-z]+$/, token: '\u0000x07' }]);
            });

            it('/^[a-z]+$', () => {
                const a2 = Array.from(predicateRegExpAbsorber('/^[a-z]+$'));
                expect(a2).to.deep.equal([{
                    error: 'invalid regexp expression, could not find ending "/"',
                    start: 0,
                    end: 8,
                    value: '/^[a-z]+$',
                    token: '\u0000x07'
                }]);
            });

            it('^[a-z]+$', () => {
                const a3 = Array.from(predicateRegExpAbsorber('^[a-z]+$'));
                expect(a3).to.deep.equal([]);
            });

            it('/^[a-z]+$\\/', () => {
                const a4 = Array.from(predicateRegExpAbsorber('/^[a-z]+$\\/'));
                expect(a4).to.deep.equal([{
                    error: 'invalid regexp expression, could not find ending "/"',
                    start: 0,
                    end: 10,
                    value: '/^[a-z]+$\\/',
                    token: '\u0000x07'
                }]);
            });
        });
    });
    describe('absorbLExpPredicate', () => {
        it('/something', () => {
            const a1 = Array.from(absorbLExpPredicate('/someting'));
            expect(a1).to.deep.equal([{
                error: 'invalid L-exp literal predicate, no following "=" found',
                value: '/someting',
                start: 0,
                end: 8,
                token: '\u0000x08'
            }]);
        });
        it('random-stuff=', () => {
            const a2 = Array.from(absorbLExpPredicate('random-stuff='));
            expect(a2).to.deep.equal([{ value: 'random-stuff', start: 0, end: 11, token: '\u0000x08' }]);
        });
        it('city\\==london', () => {
            const a3 = Array.from(absorbLExpPredicate('city\\==london'));
            expect(a3).to.deep.equal([{ value: 'city\\=', start: 0, end: 5, token: '\u0000x08' }]);
        });
    });
    describe('absorbRExpPredicate', () => {
        it('something', () => {
            const a1 = Array.from(absorbRExpPredicate('someting'));
            expect(a1).to.deep.equal([{
                error: 'invalid R-exp literal predicate, no following "]" found',
                value: 'someting',
                start: 0,
                end: 7,
                token: '\u0000x08'
            }]);
        });
        it('random-stuff]', () => {
            const a2 = Array.from(absorbRExpPredicate('random-stuff]'));
            expect(a2).to.deep.equal([{ value: 'random-stuff', start: 0, end: 11, token: '\u0000x08' }]);
        });
        it('city\\]london', () => {
            const a3 = Array.from(absorbRExpPredicate('city\\]london'));
            expect(a3).to.deep.equal([{
                error: 'invalid R-exp literal predicate, no following "]" found',
                value: 'city\\]london',
                start: 0,
                end: 11,
                token: '\u0000x08'
            }]);
        });
    });
    describe('predicateHolisticAbsorber', () => {
        it('""', () => {
            const a = Array.from(predicateHolisticAbsorber(''));
            expect(a).to.deep.equal([]);
        });
        it('"["', () => {
            const a = Array.from(predicateHolisticAbsorber('['));
            expect(a).to.deep.equal([{ token: '\u0000x0a', value: '[', start: 0, end: 0 },
            { error: 'no L value at all', token: '\u0000x08' },
            {
                token: '\u0000x09',
                error: 'no "=" token found to seperate L-exp and R-exp predicates'
            },
            { error: 'no R value at all', token: '\u0000x08' },
            { error: 'no closing ] found', token: '\u0000x0b' }]);
        });
        it('"[=]"', () => {
            const a = Array.from(predicateHolisticAbsorber('[=]'));
            expect(a).to.deep.equal([{ token: '\u0000x0a', value: '[', start: 0, end: 0 },
            { error: 'no L value at all', token: '\u0000x08' },
            { value: '=', token: '\u0000x09', end: 1, start: 1 },
            { error: 'no R value at all', token: '\u0000x08' },
            { error: 'no closing ] found', token: '\u0000x0b' }]);
        });
        it('"[="', () => {
            const a = Array.from(predicateHolisticAbsorber('[='));
            expect([
                { token: '\u0000x0a', value: '[', start: 0, end: 0 },
                { error: 'no L value at all', token: '\u0000x08' },
                { value: '=', token: '\u0000x09', end: 1, start: 1 },
                { error: 'no R value at all', token: '\u0000x08' },
                { error: 'no closing ] found', token: '\u0000x0b' }]);
        });
        it('"[city=/^London$/]"', () => {
            const a = Array.from(predicateHolisticAbsorber('[city=/^London$/]'));
            expect(a).to.deep.equal([{ token: '\u0000x0a', value: '[', start: 0, end: 0 },
            { value: 'city', start: 1, end: 4, token: '\u0000x08' },
            { value: '=', token: '\u0000x09', end: 5, start: 5 },
            { start: 6, end: 15, value: /^London$/, token: '\u0000x07' },
            { token: '\u0000x0b', value: ']', start: 16, end: 16 }]);
        });

        describe('pathEltAbsorber', () => {
            it('""', () => {
                const a = Array.from(pathEltAbsorber(''));
                expect(a).to.deep.equal([]);
            });
            it('/', () => {
                const a = Array.from(pathEltAbsorber('/'));
                expect(a).to.deep.equal([]);
            });
            it('azeaze/', () => {
                const a = Array.from(pathEltAbsorber('azeaze/'));
                expect(a).to.deep.equal([{ token: '\u0001', start: 0, end: 5, value: 'azeaze' }]);
            });
            it('/azeaze/', () => {
                const a = Array.from(pathEltAbsorber('/azeaze/', 1));
                expect(a).to.deep.equal([{ token: '\u0001', start: 1, end: 6, value: 'azeaze' }]);
            });
        });
        describe('pathAbsorber', () => {
            it('""', () => {
                const a = Array.from(pathAbsorber(''));
                expect(a).to.deep.equal([]);
            });
            it('"/"', () => {
                const a = Array.from(pathAbsorber('/'));
                expect(a).to.deep.equal([ { token: '\u000f', value: '/', start: 0, end: 0 } ]);
            });
            it('"/persons/address/[zip=/^London$/]/../firstName"', () => {
                const a = Array.from(pathAbsorber('/persons/address/[zip=/^London$/]/../firstName'));
                expect(a).to.deep.equal([{ token: '\u000f', value: '/', start: 0, end: 0 },
                { token: '\u0001', start: 1, end: 7, value: 'persons' },
                { token: '\u000f', value: '/', start: 8, end: 8 },
                { token: '\u0001', start: 9, end: 15, value: 'address' },
                { token: '\u000f', value: '/', start: 16, end: 16 },
                { token: '\u0000x0a', value: '[', start: 17, end: 17 },
                { value: 'zip', start: 18, end: 20, token: '\u0000x08' },
                { value: '=', token: '\u0000x09', end: 21, start: 21 },
                { start: 22, end: 31, value: /^London$/, token: '\u0000x07' },
                { token: '\u0000x0b', value: ']', start: 32, end: 32 },
                { token: '\u000f', value: '/', start: 33, end: 33 },
                { token: '\u0003', start: 34, end: 35, value: '..' },
                { token: '\u000f', value: '/', start: 36, end: 36 },
                { token: '\u0001', start: 37, end: 45, value: 'firstName' }]);
            });
            it('path gives errors "/customers/orderItems/[=/111/]"', () => {
                const path = '/customers/orderItems/[=/111/]';
                const tokens = Array.from(pathAbsorber(path));
                const errors = tokens.filter(f=>f.error).map(m=>m.error).join('|');
                expect(errors).to.equal('no L value at all|no "=" token found to seperate L-exp and R-exp predicates')
            });
            it('path with recursive descent "**/"',()=>{
                const path = '**/';
                const tokens = Array.from(pathAbsorber(path));
                expect(tokens).to.deep.equal([ { start: 0, end: 1, value: '**', token: '\f' },
                { token: '\u000f', value: '/', start: 2, end: 2 } ]);
            })
        });
    });
});
