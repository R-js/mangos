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
    tdpAbsorber
} = require('../lib/tokenizer');

describe('filepath', () => {
    describe('posixAbsorber', () => {
        it('empty path ""', () => {
            const answer = Array.from(posixAbsorber(''));
            console.log(answer);
        });
        it('path "/"', () => {
            const answer = Array.from(posixAbsorber('/'));
            console.log(answer);
        });
        it('path "////////"', () => {
            const answer = Array.from(posixAbsorber('////////'));
            console.log(answer);
        });
        it('path "something////////something else"', () => {
            const answer = Array.from(posixAbsorber('something////////something else'));
            console.log(answer);
        });
        it('path ".././////../.....///\\\\c:/"',()=>{
            const answer = Array.from(posixAbsorber('.././////../.....///\\\\c:/'));
            console.log(answer);
        });
        it('path "//?/UNC/Server1/share1/file.txt" is legal posix',()=>{
            const answer = Array.from(posixAbsorber('//?/UNC/Server1/share1/file.txt'));
            console.log(answer);
        })
    });
    describe('tdp (traditional dos path) Absorber', () => {
        it('path "c:',()=>{
            const answer = Array.from(tdpAbsorber('c:'));
            console.log(answer);
        });
        it('path "c://',()=>{
            const answer = Array.from(tdpAbsorber('c://'));
            console.log(answer);
        })
        it('path "c:\\',()=>{
            const answer = Array.from(tdpAbsorber('c:\\'));
            console.log(answer);
        });
        it('path "somepathelement',()=>{
            const answer = Array.from(tdpAbsorber('somepathelement'));
            console.log(answer);
        });
        it('path "c:somepath\\anothersub\\/file.txt"',()=>{
            const answer = Array.from(tdpAbsorber('c:somepath\\anothersub\\/file.txt"'));
            console.log(answer);
        });
        it('path contains legacy device names "c:\\someotherCON.txt\\/file.tx"',()=>{
            const answer = Array.from(tdpAbsorber('c:\\someotherCON.txt\\/file.txt'));
            console.log(answer);
        });
        it('path contains legacy device names "..\\.\\...\\file.txt"',()=>{
            const answer = Array.from(tdpAbsorber('..\\.\\...\\file.txt'));
            console.log(answer);
        });
        it('path contains invalid chars "..\\.\\?!{..\\file.txt"',()=>{
            const answer = Array.from(tdpAbsorber('..\\.\\?!{..\\file.txt'));
            console.log(answer);
        })
    })
});