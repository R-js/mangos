import identifierAbsorber, { lookAhead, lookAheadSize } from '../identifierTokenizer';
import { esc } from '../../utils';

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
            expect(lookAhead('ayz', 0)).toBe(true);
            expect(lookAhead('ay\\\\z', 0)).toBe(true);
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
        {
            const data = `${esc}${openBrack}${esc}${esc}${at}`;
            it(`propName with escaped chars: ${data}`, () => {
                const token = identifierAbsorber(data);
                expect(token).toEqual({ type: 'identifier', start: 0, end: 3, value: `${openBrack}${esc}` });
            });
        }
        {
            const data = `property${esc}*Name${esc}[n => 1 ]`;
            it(`propName indexed at the end: ${data}`, () => {
                const token = identifierAbsorber(data);
                expect(token).toEqual({
                    end: 16,
                    start: 0,
                    type: 'identifier',
                    value: 'property*Name[n'
                });
            });
        }
    });
});
