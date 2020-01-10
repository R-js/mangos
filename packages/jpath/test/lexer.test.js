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
    getTokens
} = require('../src/lib/tokenizer');

const {
    from: arr
} = Array;

describe('lexer', () => {
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
        it('empty predicate aka []', () => {
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
            const path =  '../...././/./\\//';
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