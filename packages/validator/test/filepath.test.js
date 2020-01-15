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
    uncTokenizer
} = require('../src/filepath/tokenizer');

describe('filepath', () => {
    describe('unc lexer', () => {
        describe('errors',()=>{
            it('unc "/./some/"', ()=>{
                const answer = Array.from(uncTokenizer('/./some/'));
                expect(answer).to.deep.equal([]);
            });
            it('unc "/"', ()=>{
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
})