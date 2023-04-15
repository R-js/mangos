import identifierAbsorber, { lookAhead, lookAheadSize } from '../identifierTokenizer';

const esc = '\\';
const openBrack = '{';
const at = '@';

describe('identifier recognition', () => {
    describe('normal operation', () => {
        it('lookAheadSize', () => {
            expect(lookAheadSize()).toBe(1);
        });
        it('lookAhead', () => {
            expect(lookAhead(' ', 0)).toBe(false);
            expect(lookAhead('\\ ', 0)).toBe(true);
        });
        it('lookAheadSize', () => {
            expect(lookAheadSize()).toBe(1);
        });
        it(`propName with escaped chars: ${esc}${openBrack}${esc}${at}`, () => {
            const name = `${esc}${openBrack}${esc}${at}`;
            const token = identifierAbsorber(name);
            expect(token).toMatchInlineSnapshot(`
                {
                  "end": 3,
                  "start": 0,
                  "type": "identifier",
                  "value": "{@",
                }
            `);
        });
        it('propName indexed at the end: property\\*Name\\[ n => 1 ]', () => {
            const name = 'property\\*Name\\[ n => 1 ]';
            const token = identifierAbsorber(name);
            expect(token).toMatchInlineSnapshot(`
                {
                  "end": 15,
                  "start": 0,
                  "type": "identifier",
                  "value": "property\\*Name\\[",
                }
            `);
        });
    });
});
