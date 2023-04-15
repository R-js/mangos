import regExpAbsorber, { lookAhead, lookAheadSize } from '../regexpTokenizer';

describe('regexp() function test', () => {
    describe('normal operation', () => {
        it('regexp(/(?:something|nothing)/)', () => {
            const token = regExpAbsorber('regexp(/(?:something|nothing)/)');
            expect(token).toEqual({
                type: 'regexp',
                start: 0,
                end: 30,
                value: /(?:something|nothing)/
            });
        });
        it('regexp with flags regexp(/(?:something|nothing)/ig)', () => {
            const data = 'regexp(/(?:something|nothing)/igsu)';
            const token = regExpAbsorber(data);
            expect(token).toEqual({
                type: 'regexp',
                start: 0,
                end: 34,
                value: /(?:something|nothing)/gisu
            });
        });
        it('regexp with valid escapes regexp(/\\\\\\//ig)', () => {
            const data = 'regexp(/\\\\\\//ig)';
            const token = regExpAbsorber(data);
            expect(token).toMatchInlineSnapshot(`
                {
                  "end": 15,
                  "start": 0,
                  "type": "regexp",
                  "value": /\\\\\\\\\\\\//gi,
                }
            `);
        });
        it('lookAhead', () => {
            const data = 'llk/regexp(/\\//)';
            expect(lookAhead(data, 4)).toBe(true);
            expect(lookAhead(data, 0)).toBe(false);
            const token = regExpAbsorber(data, 4);
            expect(token).toEqual({ type: 'regexp', start: 4, end: 15, value: /\// });
        });
        it('lookAheadSize', () => {
            expect(lookAheadSize()).toBe(8);
        });
    });
    describe('error input and and edge cases', () => {
        it('incomplete regexp predicate: "regexp(/part{4}ial/" ', () => {
            const token = regExpAbsorber('regexp(/part{4}ial/');
            expect(token).toMatchInlineSnapshot(`
                {
                  "end": 18,
                  "start": 0,
                  "type": "error.invalid.regexp",
                  "value": "regexp(/part{4}ial/",
                }
            `);
        });
        it('empty regexp predicate: "regexp(//)"', () => {
            const token = regExpAbsorber('regexp(//)');
            expect(token).toMatchInlineSnapshot(`
                {
                  "end": 9,
                  "start": 0,
                  "type": "error.invalid.regexp",
                  "value": "regexp(//)",
                }
            `);
        });
        it('unclosed regexp regexp predicate: "regexp(/\\/)"', () => {
            const token = regExpAbsorber('regexp(/\\/)');
            expect(token).toMatchInlineSnapshot(`
                {
                  "end": 10,
                  "start": 0,
                  "type": "error.invalid.regexp",
                  "value": "regexp(/\\/)",
                }
            `);
        });
    });
});
