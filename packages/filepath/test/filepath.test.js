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
    uncTokenizer,
    unxRootTokenizer,
    lfsRootTokenizer,
    sepSlicer
} = require('../lib/tokenizer');

describe('filepath', () => {
    describe('unc lexer', () => {
        describe('errors', () => {
            it('unc "/./some/"', () => {
                const answer = Array.from(uncTokenizer('/./some/'));
                expect(answer).to.deep.equal([]);
            });
            it('unc "/"', () => {
                const answer = Array.from(uncTokenizer('\\'));
                expect(answer).to.deep.equal([]);
            });
        })
        it('unc long root "//?/UNC/"', () => {
            const path = '\\\\?\\UNC\\';
            const answer = Array.from(uncTokenizer(path));
            expect(answer).to.deep.equal([{ value: '\\\\?\\UNC\\', token: '\u0000x05', start: 0, end: 7 }]);
        });
        it('unc long root "//?/"', () => {
            const path = '\\\\?\\';
            const answer = Array.from(uncTokenizer(path));
            expect(answer).to.deep.equal([{ value: '\\\\?\\', token: '\u0000x05', start: 0, end: 3 }]);
        });
        it('unc short root "//"', () => {
            const path = '\\\\';
            const answer = Array.from(uncTokenizer(path));
            expect(answer).to.deep.equal([{ value: '\\\\', token: '\u0000x07', start: 0, end: 1 }]);
        });
    });
    describe('posix root lexer', () => {
        describe('errors', () => {
            it('empty path', () => {
                const answer = Array.from(unxRootTokenizer(''));
                expect(answer).to.deep.equal([]);
            });
        });
        it('posix "/"', () => {
            const answer = Array.from(unxRootTokenizer('something'));
            expect(answer).to.deep.equal([]);
        });
    });
    describe('lfs root lexer', () => {
        describe('errors', () => {
            it('empty path', () => {
                const answer = Array.from(unxRootTokenizer(''));
                expect(answer).to.deep.equal([]);
            });
            it('lfs "c:something"', () => {
                const answer = Array.from(lfsRootTokenizer('c:something'));
                expect(answer).to.deep.equal([]);
            });
        });
        it('lfs "c:\\something"', () => {
            const answer = Array.from(lfsRootTokenizer('c:\\something'));
            expect(answer).to.deep.equal([ { value: 'c:', token: '\u0000x03', start: 0, end: 2 } ]);
        });
    });
    describe('sep lexer', () => {
        it('find / or \ in  "c:\\something\\path2/path3"', () => {
            const answer = Array.from(sepSlicer('c:\\something\\path2/path3', 3));
            expect(answer).to.deep.equal([ { value: '\\', token: '\u0001', start: 12, end: 12 },
            { value: '/', token: '\u0001', start: 18, end: 18 } ]);
        });
        it('find / or \ in empty ""', () => {
            const answer = Array.from(sepSlicer());
            expect(answer).to.deep.equal([]);
        });
    });
});
