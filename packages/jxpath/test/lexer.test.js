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
        });
    });


    describe('predicateElementTokenizer', () => {
        it('error no closing \\/ on the end of a regexp', () => {
            const text = '\\/\[a-z]';
            const tokens = arr(predicateElementTokenizer(text, 0, text.length ? text.length - 1 : 0));
            expect(tokens).to.deep.equal([{
                error: 'no closing "/" found to end the regular expression \\/[a-z]',
                token: '\u0000x07',
                start: 0,
                end: 6,
                value: '\\/[a-z]'
            }]);
        });
        it('"=" should terminate search of any token', () => {
            const text = 'sometoken=';
            const tokens = arr(predicateElementTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal(
                [{
                    value: 'sometoken',
                    token: '\u0000x08',
                    start: 0,
                    end: 8
                }]
            );
        });
        it('"hello-world"', () => {
            const text = 'hello-world';
            const tokens = arr(predicateElementTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([{
                value: 'hello-world',
                token: '\u0000x08',
                start: 0,
                end: 10
            }]);
        });
        it(`"${'\\/^[a-z]{3}$\\/'}"`, () => {
            const text = '\\/^[a-z]{3}$\\/';
            const tokens = arr(predicateElementTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([{
                value: /^[a-z]{3}$/,
                token: '\u0000x07',
                start: 0,
                end: 13
            }])
        });
        it('first part of "/^[a-z]{3}$/=somevalue"', () => {
            const text = '\\/^[a-z]{3}$\\/=somevalue';
            const tokens = arr(predicateElementTokenizer(text, 0, text.length - 1));
            expect([{
                value: /^[a-z]{3}$/,
                token: '\u0000x07',
                start: 0,
                end: 13
            }]).to.deep.equal(tokens);
        });
        it('second part of "\\/^[a-z]{3}$\\/=somevalue"', () => {
            const text = '\\/^[a-z]{3}$\\/=somevalue';
            const tokens = arr(predicateElementTokenizer(text, text.indexOf('=') + 1, text.length - 1));
            expect([{
                value: 'somevalue',
                token: '\u0000x08',
                start: 15,
                end: 23
            }]).to.deep.equal(tokens);
        });
    });
    describe('predicateTokenizer', () => {
        it('empty predicate aka []', () => {
            const text = '[]';
            const tokens = arr(predicateTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([]);
        });
        it('empty predicate aka [=]', () => {
            const text = '[=]';
            const tokens = arr(predicateTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([]);
        });
        it('partial predicate aka [=b] should error', () => {
            const text = '[=b]';
            const tokens = arr(predicateTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([]);
        });
        it('partial predicate aka [a=] should error', () => {
            const text = '[a=]';
            const tokens = arr(predicateTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([]);
        });
        it('lexer "[\\/^[a-z]{3}$\\/=somevalue]"', () => {
            const text = '[\\/^[a-z]{3}$\\/=somevalue]';
            const tokens = arr(predicateTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal(
                [{
                    value: /^[a-z]{3}$/,
                    token: '\u0000x07',
                    start: 1,
                    end: 14
                },
                {
                    value: 'somevalue',
                    token: '\u0000x08',
                    start: 16,
                    end: 24
                }
                ]
            );
        });
        it('lexer "[somekey=somevalue]"', () => {
            const text = '[somekey=somevalue]';
            const tokens = arr(predicateTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([{
                value: 'somekey',
                token: '\u0000x08',
                start: 1,
                end: 7
            },
            {
                value: 'somevalue',
                token: '\u0000x08',
                start: 9,
                end: 17
            }
            ]);

        });
        it('lexer "[som\=ekey=\\/^$\\/]"', () => {
            const text = '[som\\=ekey=\\/^$\\/]';
            const tokens = arr(predicateTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([{
                value: 'som\\=ekey',
                token: '\u0000x08',
                start: 1,
                end: 9
            },
            {
                value: /^$/,
                token: '\u0000x07',
                start: 11,
                end: 16
            }
            ]);
        });
    });
    describe('defaultTokenizer', () => {
        it('empty predicate /[a=b]/', () => {
            const text = '/[a=b]/'
            const tokens = arr(defaultTokenizer(text));
            expect(tokens).to.deep.equal([{
                token: '\u000f',
                start: 0,
                end: 0,
                value: '/'
            },
            {
                value: 'a',
                token: '\u0000x08',
                start: 2,
                end: 2
            },
            {
                value: 'b',
                token: '\u0000x08',
                start: 4,
                end: 4
            },
            {
                token: '\u000f',
                start: 6,
                end: 6,
                value: '/'
            }
            ]);
        });
        it('no arguments in defaultTokenizer', () => {
            const tokens = arr(defaultTokenizer());
            expect(tokens).to.deep.equal([]);
        });
        it('empty path should return ""', () => {
            const text = '';
            const tokens = arr(defaultTokenizer(text, 0, 0));
            expect(tokens).to.deep.equal([{
                token: '\u0001',
                start: 0,
                end: 0,
                value: ''
            }]);
        });
        it('lexer "/normal/and/simple/path"', () => {
            const text = '/normal/and/simple/path';
            const tokens = arr(defaultTokenizer(text, 0, text.length - 1));
            expect(tokens).to.deep.equal([{
                token: '\u000f',
                start: 0,
                end: 0,
                value: '/'
            },
            {
                token: '\u0001',
                start: 1,
                end: 6,
                value: 'normal'
            },
            {
                token: '\u000f',
                start: 7,
                end: 7,
                value: '/'
            },
            {
                token: '\u0001',
                start: 8,
                end: 10,
                value: 'and'
            },
            {
                token: '\u000f',
                start: 11,
                end: 11,
                value: '/'
            },
            {
                token: '\u0001',
                start: 12,
                end: 17,
                value: 'simple'
            },
            {
                token: '\u000f',
                start: 18,
                end: 18,
                value: '/'
            },
            {
                token: '\u0001',
                start: 19,
                end: 22,
                value: 'path'
            }
            ]);
        });
        it('tokenize path "/favicons/android/path', () => {
            const path = '/favicons/android/path';
            const tokens1 = getTokens(path);
            expect(tokens1).to.deep.equal([{
                token: '\u000f',
                start: 0,
                end: 0,
                value: '/'
            },
            {
                token: '\u0001',
                start: 1,
                end: 8,
                value: 'favicons'
            },
            {
                token: '\u000f',
                start: 9,
                end: 9,
                value: '/'
            },
            {
                token: '\u0001',
                start: 10,
                end: 16,
                value: 'android'
            },
            {
                token: '\u000f',
                start: 17,
                end: 17,
                value: '/'
            },
            {
                token: '\u0001',
                start: 18,
                end: 21,
                value: 'path'
            }
            ])
        });
        it('tokenize non root- path "favicons/android/path', () => {
            const path = 'favicons/android/path';
            const tokens1 = getTokens(path);
            expect(tokens1).to.deep.equal(
                [{
                    token: '\u0001',
                    start: 0,
                    end: 7,
                    value: 'favicons'
                },
                {
                    token: '\u000f',
                    start: 8,
                    end: 8,
                    value: '/'
                },
                {
                    token: '\u0001',
                    start: 9,
                    end: 15,
                    value: 'android'
                },
                {
                    token: '\u000f',
                    start: 16,
                    end: 16,
                    value: '/'
                },
                {
                    token: '\u0001',
                    start: 17,
                    end: 20,
                    value: 'path'
                }
                ]
            );
        });
        it('"favicons/"', () => {
            const path = 'favicons/';
            const tokens = getTokens(path);
            expect(tokens).to.deep.equal([{
                token: '\u0001',
                start: 0,
                end: 7,
                value: 'favicons'
            },
            {
                token: '\u000f',
                start: 8,
                end: 8,
                value: '/'
            }
            ]);
        });
        it('"favicons"', () => {
            const path = 'favicons';
            const tokens = getTokens(path);
            expect(tokens).to.deep.equal([{
                token: '\u0001',
                start: 0,
                end: 7,
                value: 'favicons'
            }]);
        });
        it(`"${'../...././/./\\//'}"`, () => {
            const path = '../...././/./\\//';
            const tokens = getTokens(path);
            expect(tokens).to.deep.equal([{
                token: '\u0003',
                start: 0,
                end: 1,
                value: '..'
            },
            {
                token: '\u000f',
                start: 2,
                end: 2,
                value: '/'
            },
            {
                token: '\u0001',
                start: 3,
                end: 6,
                value: '....'
            },
            {
                token: '\u000f',
                start: 7,
                end: 7,
                value: '/'
            },
            {
                token: '\u0004',
                start: 8,
                end: 8,
                value: '.'
            },
            {
                token: '\u000f',
                start: 9,
                end: 9,
                value: '/'
            },
            {
                token: '\u000f',
                start: 10,
                end: 10,
                value: '/'
            },
            {
                token: '\u0004',
                start: 11,
                end: 11,
                value: '.'
            },
            {
                token: '\u000f',
                start: 12,
                end: 12,
                value: '/'
            },
            {
                token: '\u0001',
                start: 13,
                end: 14,
                value: '\\/'
            },
            {
                token: '\u000f',
                start: 15,
                end: 15,
                value: '/'
            }
            ]);
        });
    });
});
