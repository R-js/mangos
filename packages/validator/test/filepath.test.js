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
    UNCLongShortAbsorber
} = require('../src/filepath/tokenizer');

describe('filepath', () => {
    describe('lexer unc root token', () => {
        describe('errors', () => {
            it('unc long root token without servername "//?/UNC/"', () => {
                const path = '\\\\?\\UNC\\';
                const answer = Array.from(UNCLongShortAbsorber('//?/UNC/', path, 0, path.length - 1));
                expect(answer).to.deep.equal([{
                    error: 'missing "servername" part in "//?/UNC//servername/mount" for unc long name',
                    start: 0,
                    end: 7,
                    token: '\u0000x05'
                }]);
            });
            it('unc long root token without drive mount "//?/UNC/myserver/"', () => {
                const path1 = '\\\\?\\UNC\\z\\';
                const path2 = '\\\\?\\UNC\\z';
                const answer1 = Array.from(UNCLongShortAbsorber('//?/UNC/', path1, 0, path1.length - 1));
                const answer2 = Array.from(UNCLongShortAbsorber('//?/UNC/', path2, 0, path2.length - 1))
                expect(answer1).to.deep.equal([{
                    error: 'missing "drive mount" part in "//?/UNC//servername/mount" for unc long name',
                    start: 0,
                    end: 9,
                    token: '\u0000x05'
                }]);
                expect(answer2).to.deep.equal([{
                    error: 'missing "servername" part in "//?/UNC//servername/mount" for unc long name',
                    start: 0,
                    end: 8,
                    token: '\u0000x05'
                }]);
            });
            it('currupted unc path"//?/UN"', () => {
                const path1 = '\\\\?\\UN';
                const answer1 = Array.from(UNCLongShortAbsorber('//?/UNC/', path1, 0, path1.length - 1));
                expect(answer1).to.deep.equal([]);
            });
            it('currupted short unc path"//?/"', () => {
                const path1 = '\\\\?\\UN';
                const answer1 = Array.from(UNCLongShortAbsorber('//?/', path1, 0, path1.length - 1));
                expect(answer1).to.deep.equal([ { error:
                    'missing "drive mount" part in "//?//servername/mount" for unc long name',
                   start: 0,
                   end: 5,
                   token: '\u0000x05' } ]);
            });
        });
    })
})