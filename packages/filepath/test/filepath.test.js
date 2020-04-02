const chaiAsPromised = require('chai-as-promised');

const {
    describe,
    it,
} = require('mocha');

const chai = require('chai');
chai.should();
chai.use(chaiAsPromised);

const path = require('path');

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
    resolve,
    inferPathType,
    lexPath
} = require('../lib/parser');

describe('filepath', () => {
    describe('resolve', () => {
        describe('test "start" and "end" tokens', () => {
            it('test end and start props when resolving from "//?/UNC/Server/share/", to "../../hello/world"', () => {
                const answer = resolve('//?/UNC/Server/share/', '../../hello/world');
                const renderPath = answer.path.map(m => m.value).join('');
                const fidelity = answer.path.map(m => renderPath.slice(m.start, m.end + 1)).join('');
                expect(fidelity).to.equal('\\\\?\\UNC\\Server\\share\\hello\\world');
                expect(answer).to.deep.equal({
                    path: [
                        {
                            token: '\u0005',
                            value: '\\\\?\\UNC\\Server\\share',
                            start: 0,
                            end: 19
                        },
                        { token: '\u0001', start: 20, end: 20, value: '\\' },
                        { token: '\u0006', start: 21, end: 31, value: 'hello' },
                        { token: '\u0001', start: 32, end: 32, value: '\\' },
                        { token: '\u0006', start: 33, end: 49, value: 'world' }
                    ],
                    type: 'devicePath'
                });
            });
            it('from "", to ""', () => {
                const answer = resolve();
                // since the answer is the current working directory we test with "fidelity" heuristic
                const cwd = path.resolve();
                const renderPath = answer.path.map(m => m.value).join('');
                const fidelity = answer.path.map(m => renderPath.slice(m.start, m.end + 1)).join('');
                expect(fidelity.toLowerCase()).to.equal(cwd.toLowerCase()); // in case of dos , driveletters, unc, devicePath can have UpperCase
            });
        });

        it('from "//?/UNC/Server/share/", to "../../../../../hello/world"', () => {
            const answer = resolve('//?/UNC/Server/share/', '../../../../../hello/world');
            // since the answer is the current working directory we test with "fidelity" heuristic
            // const renderPath = answer.path.map(m => m.value).join('');
            expect(answer).to.deep.equal({
                path:
                    [{
                        token: '\u0005',
                        value: '\\\\?\\UNC\\Server\\share',
                        start: 0,
                        end: 19
                    },
                    { token: '\u0001', start: 20, end: 20, value: '\\' },
                    { token: '\u0006', start: 21, end: 40, value: 'hello' },
                    { token: '\u0001', start: 41, end: 41, value: '\\' },
                    { token: '\u0006', start: 42, end: 67, value: 'world' }],
                type: 'devicePath'
            });
        });

        it('from "//Server1/Share1/test1/", to "../../../../../hello/world"', () => {
            const answer = resolve('//Server1/Share1/test1', '../../../../../hello/world');
            expect(answer).to.deep.equal({
                path:
                    [{
                        token: '\u0004',
                        value: '\\\\Server1\\Share1',
                        start: 0,
                        end: 15
                    },
                    { token: '\u0001', start: 16, end: 16, value: '\\' },
                    { token: '\u0006', start: 17, end: 36, value: 'hello' },
                    { token: '\u0001', start: 37, end: 37, value: '\\' },
                    { token: '\u0006', start: 38, end: 63, value: 'world' }],
                type: 'unc'
            });
        });
        it('from "C://Server1/Share1/test1/", to "../../../../../hello/world"', () => {
            const answer = resolve('C://Server1/Share1/test1/', '../../../../../hello/world');
            // since the answer is the current working directory we test with "fidelity" heuristic
            //const renderPath = answer.path.map(m => m.value).join('');
            expect(answer).to.deep.equal({
                path:
                    [{ token: '\u0003', value: 'c:', start: 0, end: 1 },
                    { token: '\u0001', start: 2, end: 2, value: '\\' },
                    { token: '\u0006', start: 3, end: 22, value: 'hello' },
                    { token: '\u0001', start: 23, end: 23, value: '\\' },
                    { token: '\u0006', start: 24, end: 49, value: 'world' }],
                type: 'dos'
            });
        });

        it('from "//./Volume{b75e2c83-0000-0000-0000-602f00000000}/ Test/Foo.txt", to "../../../../../hello/world"', () => {
            const answer = resolve('//./Volume{b75e2c83-0000-0000-0000-602f00000000}/Test/Foo.txt', '../../.././././///hello/world');
            expect(answer).to.deep.equal({
                path:
                    [{
                        token: '\u0005',
                        value: '\\\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}',
                        start: 0,
                        end: 47
                    },
                    { token: '\u0001', start: 48, end: 48, value: '\\' },
                    { token: '\u0006', start: 49, end: 71, value: 'hello' },
                    { token: '\u0001', start: 72, end: 72, value: '\\' },
                    { token: '\u0006', start: 73, end: 101, value: 'world' }],
                type: 'devicePath'
            })
        });
        it('from "//./Volume{b75e2c83-0000-0000-0000-602f00000000}/ Test/Foo.txt", to "../../../../../hello/world", "c:\\Users\\guest"', () => {
            const answer = resolve('//./Volume{b75e2c83-0000-0000-0000-602f00000000}/Test/Foo.txt', '../../.././././///hello/world', 'c:\\Users\\guest');
            expect(answer).to.deep.equal({
                path:
                    [{ token: '\u0003', value: 'c:', start: 0, end: 1 },
                    { token: '\u0001', start: 2, end: 2, value: '\\' },
                    { token: '\u0006', start: 3, end: 7, value: 'Users' },
                    { token: '\u0001', start: 8, end: 8, value: '\\' },
                    { token: '\u0006', start: 9, end: 13, value: 'guest' }],
                type: 'dos'
            });
        });
    });
    describe('lexPath', () => {
        it('path "//?/UNC/Server/share"', () => {
            const answer = lexPath('C:\\somedir\\someOtherdir?:\\');
            expect(answer).to.deep.equal({
                type: 'dos',
                path:
                    [{ token: '\u0003', value: 'c:', start: 0, end: 1 },
                    { token: '\u0001', start: 2, end: 2, value: '\\' },
                    { token: '\u0006', start: 3, end: 9, value: 'somedir' },
                    { token: '\u0001', start: 10, end: 10, value: '\\' },
                    {
                        token: '\u0006',
                        start: 11,
                        end: 24,
                        value: 'someOtherdir?:',
                        error: 'name "someOtherdir?:" contains invalid characters'
                    },
                    { token: '\u0001', start: 25, end: 25, value: '\\' }],
                firstError:
                {
                    token: '\u0006',
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
                type: 'devicePath',
                path: [{
                    token: '\u0005',
                    value: '\\\\?\\UNC\\Server\\share',
                    start: 0,
                    end: 19
                }
                ]
            });
        });
    });
    describe('inferPathType', () => {
        it('path "c:\\Users\\" interpreted as dos and unix types', () => {
            const answer = Array.from(inferPathType('c:\\Users\\', { posix: true, dos: true }));
            expect(answer).to.deep.equal([{
                "dos": {
                    "path": [{
                        "token": "\u0003",
                        "value": "c:",
                        "start": 0,
                        "end": 1
                    }, {
                        "token": "\u0001",
                        "start": 2,
                        "end": 2,
                        "value": "\\"
                    }, {
                        "token": "\u0006",
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
            },
            {
                posix: {
                    "path": [
                        {
                            "end": 8,
                            "start": 0,
                            "token": "\u0006",
                            "value": "c:\\Users\\",
                        }
                    ]
                }
            }
            ]);
        });
        it('path "\\\\Users\\" as "dos"', () => {
            const answer = Array.from(inferPathType('\\\\Users\\', {
                dos: true
            }));
            expect(answer).to.deep.equal([{
                "dos": {
                    path: [
                        { token: '\u0003', value: 'c:', start: 0, end: 1 },
                        { token: '\u0001', start: 2, end: 2, value: '\\' },
                        { token: '\u0006', start: 3, end: 7, value: 'Users' },
                        { token: '\u0001', start: 8, end: 8, value: '\\' }
                    ]
                }
            }]);
        });
        it('interpret path "/path1/path2" as a "dos"', () => {
            const answer = Array.from(inferPathType('/path1/path2', { dos: true }));
            expect(answer).to.deep.equal([{
                dos: {
                    path:
                        [{ token: '\u0003', value: 'c:', start: 0, end: 1 },
                        { token: '\u0001', start: 2, end: 2, value: '\\' },
                        { token: '\u0006', start: 3, end: 7, value: 'path1' },
                        { token: '\u0001', start: 8, end: 8, value: '\\' },
                        { token: '\u0006', start: 9, end: 13, value: 'path2' }]
                }
            }]);
        });
        it('path "\\Users\\share\\" should be "unc"', () => {
            const answer = Array.from(inferPathType('\\\\Users\\share\\'));
            expect(answer).to.deep.equal([
                {
                    unc:
                    {
                        path: [
                            { token: '\u0004', value: '\\\\Users\\share', start: 0, end: 12 },
                            { token: '\u0001', start: 13, end: 13, value: '\\' }]
                    }
                }]);
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
                token: '\u0002',
                start: 0,
                end: 0,
                value: '/'
            }]);
        });
        it('path "////////"', () => {
            const answer = Array.from(posixAbsorber('////////'));
            expect(answer).to.deep.equal([{
                token: '\u0002',
                start: 0,
                end: 7,
                value: '////////'
            }]);
        });
        it('path "something////////something else"', () => {
            const answer = Array.from(posixAbsorber('something////////something else'));
            expect(answer).to.deep.equal([{
                token: '\u0006',
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
                token: '\u0006',
                start: 17,
                end: 30,
                value: 'something else'
            }
            ]);
        });
        it('path ".././////../.....///\\\\c:/"', () => {
            const answer = Array.from(posixAbsorber('.././////../.....///\\\\c:/'));
            expect(answer).to.deep.equal([{
                token: '\u0007',
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
                token: '\u0008',
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
                token: '\u0007',
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
                token: '\u0006',
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
                token: '\u0006',
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
                token: '\u0002',
                start: 0,
                end: 1,
                value: '//'
            },
            {
                token: '\u0006',
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
                token: '\u0006',
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
                token: '\u0006',
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
                token: '\u0006',
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
                token: '\u0006',
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
                token: '\u0004',
                value: '\\\\server\\share',
                start: 0,
                end: 13
            },
            {
                end: 14,
                start: 14,
                token: '\u0001',
                value: '\\'
            }
            ]);
        });
        it('empty path "//server/share////hello\\world"', () => {
            const answer = Array.from(uncAbsorber('//server/share////hello\\world'));
            expect(answer).to.deep.equal([{
                token: '\u0004',
                value: '\\\\server\\share',
                start: 0,
                end: 13
            },
            {
                token: '\u0001',
                start: 14,
                end: 17,
                value: '\\'
            },
            {
                token: '\u0006',
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
                token: '\u0006',
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
                token: '\u0003',
                value: 'c:',
                start: 0,
                end: 1
            }]);
        });
        it('path "c://', () => {
            const answer = Array.from(tdpAbsorber('c://'));
            expect(answer).to.deep.equal([{
                token: '\u0003',
                value: 'c:',
                start: 0,
                end: 1
            },
            {
                token: '\u0001',
                start: 2,
                end: 3,
                value: '\\'
            }
            ]);
        })
        it('path "c:\\', () => {
            const answer = Array.from(tdpAbsorber('c:\\'));
            expect(answer).to.deep.equal([{
                token: '\u0003',
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
                token: '\u0006',
                start: 0,
                end: 14,
                value: 'somepathelement'
            }]);
        });
        it('path "c:somepath\\anothersub\\/file.txt"', () => {
            const answer = Array.from(tdpAbsorber('c:somepath\\anothersub\\/file.txt"'));
            expect(answer).to.deep.equal([{
                token: '\u0003',
                value: 'c:',
                start: 0,
                end: 1
            },
            {
                token: '\u0006',
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
                token: '\u0006',
                start: 11,
                end: 20,
                value: 'anothersub'
            },
            {
                token: '\u0001',
                start: 21,
                end: 22,
                value: '\\'
            },
            {
                token: '\u0006',
                start: 23,
                end: 31,
                value: 'file.txt"',
                error: 'name "file.txt"" contains invalid characters'
            }
            ]);
        });
        it('path contains legacy device names "c:\\someotherCON.txt\\/file.tx"', () => {
            const answer = Array.from(tdpAbsorber('c:\\someotherCON.txt\\/file.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0003',
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
                token: '\u0006',
                start: 3,
                end: 18,
                value: 'someotherCON.txt',
                error: 'contains forbidden DOS legacy device name: CON'
            },
            {
                token: '\u0001',
                start: 19,
                end: 20,
                value: '\\'
            },
            {
                token: '\u0006',
                start: 21,
                end: 28,
                value: 'file.txt'
            }
            ]);
        });
        it('path contains legacy device names "..\\.\\...\\file.txt"', () => {
            const answer = Array.from(tdpAbsorber('..\\.\\...\\file.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0007',
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
                token: '\u0008',
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
                token: '\u0006',
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
                token: '\u0006',
                start: 9,
                end: 16,
                value: 'file.txt'
            }
            ]);
        });
        it('path contains invalid chars "..\\.\\?!{..\\file.txt"', () => {
            const answer = Array.from(tdpAbsorber('..\\.\\?!{..\\file.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0007',
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
                token: '\u0008',
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
                token: '\u0006',
                start: 5,
                end: 9,
                value: '?!{..',
                error: 'name "?!{.." contains invalid characters'
            },
            {
                token: '\u0001',
                start: 10,
                end: 10,
                value: '\\'
            },
            {
                token: '\u0006',
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
                token: '\u0005',
                value: '\\\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}',
                start: 0,
                end: 47
            },
            {
                end: 48,
                start: 48,
                token: "\u0001",
                value: "\\"
            },
            {
                token: '\u0006',
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
                token: '\u0006',
                start: 54,
                end: 60,
                value: 'Foo.txt'
            }
            ]);
        });
        it('unc path "\\\\?\\UNC\\Server\\Share\\"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\'));
            expect(answer).to.deep.equal([{
                token: '\u0005',
                value: '\\\\?\\UNC\\Server\\Share',
                start: 0,
                end: 19
            },
            {
                "end": 20,
                "start": 20,
                "token": "\u0001",
                "value": "\\"
            }
            ]);
        });
        it('unc path "\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0005',
                value: '\\\\?\\UNC\\Server\\Share',
                start: 0,
                end: 19
            },
            {
                "end": 20,
                "start": 20,
                "token": "\u0001",
                "value": "\\"
            },
            {
                token: '\u0006',
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
                token: '\u0006',
                start: 25,
                end: 31,
                value: 'bar.txt'
            }
            ]);
        });
        it('unc path "\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt'));
            expect(answer).to.deep.equal([{
                token: '\u0005',
                value: '\\\\?\\UNC\\Server\\Share',
                start: 0,
                end: 19
            },
            {
                "end": 20,
                "start": 20,
                "token": "\u0001",
                "value": "\\"
            },
            {
                token: '\u0006',
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
                token: '\u0006',
                start: 25,
                end: 31,
                value: 'bar.txt'
            }
            ]);
        });
        it('tdp path "\\\\?\\c:\\dir1\\dir2"', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\c:\\dir1\\dir2'));
            expect(answer).to.deep.equal([{
                token: '\u0005',
                value: '\\\\?\\c:',
                start: 0,
                end: 5
            },
            {
                "end": 6,
                "start": 6,
                "token": "\u0001",
                "value": "\\"
            },
            {
                token: '\u0006',
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
                token: '\u0006',
                start: 12,
                end: 15,
                value: 'dir2'
            }
            ]);
        });
        it('unc path "\\\\?\\c:" will be recognized', () => {
            const answer = Array.from(ddpAbsorber('\\\\?\\c:'));
            expect(answer).to.deep.equal([
                {
                    end: 5,
                    start: 0,
                    token: '\u0005',
                    value: "\\\\?\\c:"
                }
            ]);
        });
    });
});