
'use strict'
const { expect } = require('chai')
const { V } = require('src/proxy');


describe('filepath feature', function () {
  it('path posix "../src/somedata.txt" should be relative path"', () => {
    const checker = V.filepath({ posix: true })
    const result = checker('../src/somedata.txt');
    expect(result).to.deep.equal([['../src/somedata.txt', 'posix'], undefined]);
  });
  it('path dos "../src/somedata.txt" (will return "\\") should be relative path"', () => {
    const checker = V.filepath({ dos: true })
    expect(checker('../src/somedata.txt')).to.deep.equal([['..\\src\\somedata.txt', 'dos'], undefined]);
  });
  it('path dos "D:/src/somedata.txt" (will return "\\") as "dos" path', () => {
    const checker = V.filepath({ dos: true })
    expect(checker('D:/src/somedata.txt')).to.deep.equal([['d:\\src\\somedata.txt', 'dos'], undefined]);
  });
  it('normalize dos "D:/src/../..\\somedata.txt" valid but strange posix path elements', () => {
    const checker = V.filepath({ posix: true });
    const result = checker('D:/src/../..\\somedata.txt');
    // "D:" and "..\\somedata.txt" is a valid posix filepath elements
    expect(result).to.deep.equal([['D:/src/../..\\somedata.txt', 'posix'], undefined]);
  });
  it('path force invalid path type check (unc) "//?/c:/subdir"  path"', () => {
    const checker = V.filepath({ unc: true });
    const result = checker('//?/c:/subdir');
    expect(result).to.deep.equal([ [ '//?/c:/subdir' ], 'could not lex filepath', true ]);
  });

});
