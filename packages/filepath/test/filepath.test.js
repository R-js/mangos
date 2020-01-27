const chaiAsPromised = require('chai-as-promised');
const {
    describe,
    it,
} = require('mocha');
const chai = require('chai');
chai.should();
chai.use(chaiAsPromised);
const {
    expect
} = chai;

const {
    posixAbsorber,
    tdpAbsorber,
    uncAbsorber,
    ddpAbsorber
} = require('../lib/tokenizer');

const {
    evaluate,
    resolve,
    inferPathType,
    lexPath
} = require('../lib/parser');


const log = o => console.log(JSON.stringify(o));

describe('filepath', () => {
    describe('lexPath', () => {
        it('path "//?/UNC/Server/share"', () => {
            const answer = lexPath('C:\\somedir\\someOtherdir?:\\');
            expect(answer).to.deep.equal({
                path:
                    [{ token: '\u0000x03', value: 'c:', start: 0, end: 1 },
                    { token: '\u0001', start: 2, end: 2, value: '\\' },
                    { token: '\u0000x06', start: 3, end: 9, value: 'somedir' },
                    { token: '\u0001', start: 10, end: 10, value: '\\' },
                    {
                        token: '\u0000x06',
                        start: 11,
                        end: 24,
                        value: 'someOtherdir?:',
                        error: 'name "someOtherdir?:" contains invalid characters'
                    },
                    { token: '\u0001', start: 25, end: 25, value: '\\' }],
                firstError:
                {
                    token: '\u0000x06',
                    start: 11,
                    end: 24,
                    value: 'someOtherdir?:',
                    error: 'name "someOtherdir?:" contains invalid characters'
                }
            });
        });
        it('path "//?/UNC/Server/share"', () => {
            const answer = lexPath('//?/UNC/Server/share');
            expect(answer).to.deep.equal({
                path: [{
                    token: '\u0000x04',
                    value: '\\\\?\\UNC\\',
                    start: 0,
                    end: 7
                },
                {
                    token: '\u0000x06',
                    start: 8,
                    end: 13,
                    value: 'Server'
                },
                {
                    token: '\u0001',
                    start: 14,
                    end: 14,
                    value: '/'
                },
                {
                    token: '\u0000x06',
                    start: 15,
                    end: 19,
                    value: 'share'
                }
                ]
            });
        });
    });
    describe('inferPathType', () => {
        it('path "c:\\Users\\"', () => {
            const answer = inferPathType('c:\\Users\\');
            expect(answer).to.deep.equal({
                "dos": {
                    "path": [{
                        "token": "\u0000x03",
                        "value": "c:",
                        "start": 0,
                        "end": 1
                    }, {
                        "token": "\u0001",
                        "start": 2,
                        "end": 2,
                        "value": "\\"
                    }, {
                        "token": "\u0000x06",
                        "start": 3,
                        "end": 7,
                        "value": "Users"
                    }, {
                        "token": "\u0001",
                        "start": 8,
                        "end": 8,
                        "value": "\\"
                    }]
                }
            });
        });
        it('path "\\\\Users\\" as "dos"', () => {
            const answer = inferPathType('\\Users\\', {
                dos: true
            });
            expect(answer).to.deep.equal({
                "dos": {
                    "path": [{
                        "token": "\u0001",
                        "start": 0,
                        "end": 0,
                        "value": "\\"
                    }, {
                        "token": "\u0000x06",
                        "start": 1,
                        "end": 5,
                        "value": "Users"
                    }, {
                        "token": "\u0001",
                        "start": 6,
                        "end": 6,
                        "value": "\\"
                    }]
                }
            });
        });
        it('path "\\Users\\share\\" should be "unc"', () => {
            const answer = inferPathType('\\\\Users\\share\\');
            expect(answer).to.deep.equal({
                "unc": {
                    "path": [{
                        "token": "\u0000x04",
                        "value": "\\\\Users\\share\\",
                        "start": 0,
                        "end": 13
                    }]
                },
                "dos": {
                    "path": [{
                        "token": "\u0001",
                        "start": 0,
                        "end": 1,
                        "value": "\\\\"
                    }, {
                        "token": "\u0000x06",
                        "start": 2,
                        "end": 6,
                        "value": "Users"
                    }, {
                        "token": "\u0001",
                        "start": 7,
                        "end": 7,
                        "value": "\\"
                    }, {
                        "token": "\u0000x06",
                        "start": 8,
                        "end": 12,
                        "value": "share"
                    }, {
                        "token": "\u0001",
                        "start": 13,
                        "end": 13,
                        "value": "\\"
                    }]
                }
            });
        });
    });
    describe('posixAbsorber', () => {
        it('empty path ""', () => {
            const answer = Array.from(posixAbsorber(''));
            expect([]).to.deep.equal(answer);
        });
        it('path "/"', () => {
            const answer = Array.from(posixAbsorber('/'));
            expect(answer).to.deep.equal([{
                token: '\u0000x02',
                start: 0,
                end: 0,
                value: '/'
            }]);
        });
        it('path "////////"', () => {
            const answer = Array.from(posixAbsorber('////////'));
            expect(answer).to.deep.equal([{
                token: '\u0000x02',
                start: 0,
                end: 7,
                value: '////////'
            }]);
        });
        it('path "something////////something else"', () => {
            const answer = Array.from(posixAbsorber('something////////something else'));
            expect(answer).to.deep.equal([{
                token: '\u0000x06',
                start: 0,
                end: 8,
                value: 'something'
            },
            {
                token: '\u0001',
                start: 9,
                end: 16,
                value: '////////'
            },
            {
                token: '\u0000x06',
                start: 17,
                end: 30,
                value: 'something else'
            }
            ]);
        });
        it('path ".././////../.....///\\\\c:/"', () => {
            const answer = Array.from(posixAbsorber('.././////../.....///\\\\c:/'));
            expect(answer).to.deep.equal([{
                token: '\u0000x07',
                start: 0,
                end: 1,
                value: '..'
            },
            {
                token: '\u0001',
                start: 2,
                end: 2,
                value: '/'
            },
            {
                token: '\u0000x08',
                start: 3,
                end: 3,
                value: '.'
            },
            {
                token: '\u0001',
                start: 4,
                end: 8,
                value: '/////'
            },
            {
                token: '\u0000x07',
                start: 9,
                end: 10,
                value: '..'
            },
            {
                token: '\u0001',
                start: 11,
                end: 11,
                value: '/'
            },
            {
                token: '\u0000x06',
                start: 12,
                end: 16,
                value: '.....'
            },
            {
                token: '\u0001',
                start: 17,
                end: 19,
                value: '///'
            },
            {
                token: '\u0000x06',
                start: 20,
                end: 23,
                value: '\\\\c:'
            },
            {
                token: '\u0001',
                start: 24,
                end: 24,
                value: '/'
            }
            ]);
        });
        it('path "//?/UNC/Server1/share1/file.txt" is legal posix', () => {
            const answer = Array.from(posixAbsorber('//?/UNC/Server1/share1/file.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0000x02',
                start: 0,
                end: 1,
                value: '//'
            },
            {
                token: '\u0000x06',
                start: 2,
                end: 2,
                value: '?'
            },
            {
                token: '\u0001',
                start: 3,
                end: 3,
                value: '/'
            },
            {
                token: '\u0000x06',
                start: 4,
                end: 6,
                value: 'UNC'
            },
            {
                token: '\u0001',
                start: 7,
                end: 7,
                value: '/'
            },
            {
                token: '\u0000x06',
                start: 8,
                end: 14,
                value: 'Server1'
            },
            {
                token: '\u0001',
                start: 15,
                end: 15,
                value: '/'
            },
            {
                token: '\u0000x06',
                start: 16,
                end: 21,
                value: 'share1'
            },
            {
                token: '\u0001',
                start: 22,
                end: 22,
                value: '/'
            },
            {
                token: '\u0000x06',
                start: 23,
                end: 30,
                value: 'file.txt'
            }
            ]);
        })
    });
    describe('uncAbsorber', () => {
        it('empty path ""', () => {
            const answer = Array.from(uncAbsorber(''));
            expect(answer).to.deep.equal([]);
        });
        it('empty path "//server/share/"', () => {
            const answer = Array.from(uncAbsorber('//server/share/'));
            expect(answer).to.deep.equal([{
                token: '\u0000x04',
                value: '\\\\server\\share\\',
                start: 0,
                end: 14
            }]);
        });
        it('empty path "//server/share////hello\\world"', () => {
            const answer = Array.from(uncAbsorber('//server/share////hello\\world'));
            expect(answer).to.deep.equal([{
                token: '\u0000x04',
                value: '\\\\server\\share\\',
                start: 0,
                end: 14
            },
            {
                token: '\u0001',
                start: 15,
                end: 17,
                value: '///'
            },
            {
                token: '\u0000x06',
                start: 18,
                end: 22,
                value: 'hello'
            },
            {
                token: '\u0001',
                start: 23,
                end: 23,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 24,
                end: 28,
                value: 'world'
            }
            ]);
        });
    });
    describe('tdp (traditional dos path) Absorber', () => {
        it('path "c:', () => {
            const answer = Array.from(tdpAbsorber('c:'));
            expect(answer).to.deep.equal([{
                token: '\u0000x03',
                value: 'c:',
                start: 0,
                end: 1
            }]);
        });
        it('path "c://', () => {
            const answer = Array.from(tdpAbsorber('c://'));
            expect(answer).to.deep.equal([{
                token: '\u0000x03',
                value: 'c:',
                start: 0,
                end: 1
            },
            {
                token: '\u0001',
                start: 2,
                end: 3,
                value: '//'
            }
            ]);
        })
        it('path "c:\\', () => {
            const answer = Array.from(tdpAbsorber('c:\\'));
            expect(answer).to.deep.equal([{
                token: '\u0000x03',
                value: 'c:',
                start: 0,
                end: 1
            },
            {
                token: '\u0001',
                start: 2,
                end: 2,
                value: '\\'
            }
            ]);
        });
        it('path "somepathelement', () => {
            const answer = Array.from(tdpAbsorber('somepathelement'));
            expect(answer).to.deep.equal([{
                token: '\u0000x06',
                start: 0,
                end: 14,
                value: 'somepathelement'
            }]);
        });
        it('path "c:somepath\\anothersub\\/file.txt"', () => {
            const answer = Array.from(tdpAbsorber('c:somepath\\anothersub\\/file.txt"'));
            expect(answer).to.deep.equal([{
                token: '\u0000x03',
                value: 'c:',
                start: 0,
                end: 1
            },
            {
                token: '\u0000x06',
                start: 2,
                end: 9,
                value: 'somepath'
            },
            {
                token: '\u0001',
                start: 10,
                end: 10,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 11,
                end: 20,
                value: 'anothersub'
            },
            {
                token: '\u0001',
                start: 21,
                end: 22,
                value: '\\/'
            },
            {
                token: '\u0000x06',
                start: 23,
                end: 31,
                value: 'file.txt"',
                error: 'name "file.txt\"" contains invalid characters'
            }
            ]);
        });
        it('path contains legacy device names "c:\\someotherCON.txt\\/file.tx"', () => {
            const answer = Array.from(tdpAbsorber('c:\\someotherCON.txt\\/file.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0000x03',
                value: 'c:',
                start: 0,
                end: 1
            },
            {
                token: '\u0001',
                start: 2,
                end: 2,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 3,
                end: 18,
                value: 'someotherCON.txt',
                error: 'contains forbidden DOS legacy device name: CON'
            },
            {
                token: '\u0001',
                start: 19,
                end: 20,
                value: '\\/'
            },
            {
                token: '\u0000x06',
                start: 21,
                end: 28,
                value: 'file.txt'
            }
            ]);
        });
        it('path contains legacy device names "..\\.\\...\\file.txt"', () => {
            const answer = Array.from(tdpAbsorber('..\\.\\...\\file.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0000x07',
                start: 0,
                end: 1,
                value: '..'
            },
            {
                token: '\u0001',
                start: 2,
                end: 2,
                value: '\\'
            },
            {
                token: '\u0000x08',
                start: 3,
                end: 3,
                value: '.'
            },
            {
                token: '\u0001',
                start: 4,
                end: 4,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 5,
                end: 7,
                value: '...'
            },
            {
                token: '\u0001',
                start: 8,
                end: 8,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 9,
                end: 16,
                value: 'file.txt'
            }
            ]);
        });
        it('path contains invalid chars "..\\.\\?!{..\\file.txt"', () => {
            const answer = Array.from(tdpAbsorber('..\\.\\?!{..\\file.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0000x07',
                start: 0,
                end: 1,
                value: '..'
            },
            {
                token: '\u0001',
                start: 2,
                end: 2,
                value: '\\'
            },
            {
                token: '\u0000x08',
                start: 3,
                end: 3,
                value: '.'
            },
            {
                token: '\u0001',
                start: 4,
                end: 4,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 5,
                end: 9,
                value: '?!{..',
                error: 'name \"?!{..\" contains invalid characters'
            },
            {
                token: '\u0001',
                start: 10,
                end: 10,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 11,
                end: 18,
                value: 'file.txt'
            }
            ]);
        })
    })
    describe('dos device path', () => {
        it('empty path ""', () => {
            const answer = Array.from(ddpAbsorber(''));
            expect(answer).to.deep.equal([]);
        });
        it('volume uuid path "\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}\\Test\\Foo.txt"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}\\Test\\Foo.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0000x05',
                value: '\\\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}\\',
                start: 0,
                end: 48
            },
            {
                token: '\u0000x06',
                start: 49,
                end: 52,
                value: 'Test'
            },
            {
                token: '\u0001',
                start: 53,
                end: 53,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 54,
                end: 60,
                value: 'Foo.txt'
            }
            ]);
        });
        it('unc path "\\\\?\\UNC\\Server\\Share\\"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\'));
            expect(answer).to.deep.equal([{
                token: '\u0000x05',
                value: '\\\\?\\UNC\\Server\\Share\\',
                start: 0,
                end: 20
            }]);
        });
        it('unc path "\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0000x05',
                value: '\\\\?\\UNC\\Server\\Share\\',
                start: 0,
                end: 20
            },
            {
                token: '\u0000x06',
                start: 21,
                end: 23,
                value: 'Foo'
            },
            {
                token: '\u0001',
                start: 24,
                end: 24,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 25,
                end: 31,
                value: 'bar.txt'
            }
            ]);
        });
        it('unc path "\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0000x05',
                value: '\\\\?\\UNC\\Server\\Share\\',
                start: 0,
                end: 20
            },
            {
                token: '\u0000x06',
                start: 21,
                end: 23,
                value: 'Foo'
            },
            {
                token: '\u0001',
                start: 24,
                end: 24,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 25,
                end: 31,
                value: 'bar.txt'
            }
            ]);
        });
        it('tdp path "\\\\?\\c:\\dir1\\dir2"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\c:\\dir1\\dir2'));
            expect(answer).to.deep.equal([{
                token: '\u0000x05',
                value: '\\\\?\\undefined\\undefined\\',
                start: 0,
                end: 6
            },
            {
                token: '\u0000x06',
                start: 7,
                end: 10,
                value: 'dir1'
            },
            {
                token: '\u0001',
                start: 11,
                end: 11,
                value: '\\'
            },
            {
                token: '\u0000x06',
                start: 12,
                end: 15,
                value: 'dir2'
            }
            ]);
        });
        it('unc path "\\\\?\\c:" will not be recognized', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\c:'));
            expect(answer).to.deep.equal([]);
        });
    });
});