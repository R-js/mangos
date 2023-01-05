import { debug } from '../index';

jest.setTimeout(10e3);

function delay(ts: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ts);
  });
}

describe('femto', () => {
  describe('invalied input and edge cases', () => {
    it('no namespace', async () => {
      const printer = debug('');
      printer('hello world');
      const printer2 = debug('some namespace');
      printer2('1 this should work');
      await delay(500);
      printer2('2 this should work');
      const prA = debug('4');
      prA('prA');
      const prB = debug('5');
      prB('prB');
      //const prC = debug('6');
      //prC('prC');

      const printer3 = debug('3rd namespace');
      printer3('1 this should work');
      await delay(500);
      printer3('2 this should work');
    });
  });
});
