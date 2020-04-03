
'use strict'
const { expect } = require('chai')
const { V } = require('src/proxy');

describe('url feature', function () {
  const urlFull = 'https://tools.ietf.org/html/rfc3986#page-6';
  it(`validate "${urlFull}"`, () => {
    const checker = V.url;
    const result = checker(urlFull);
    expect(result).to.deep.equal([
      [
        urlFull,
        {
          href: urlFull,
          origin: 'https://tools.ietf.org',
          protocol: 'https:',
          username: '',
          password: '',
          host: 'tools.ietf.org',
          hostname: 'tools.ietf.org',
          port: '',
          pathname: '/html/rfc3986',
          search: '',
          hash: '#page-6',
          searchParams: {}
        }
      ],
      undefined,
      undefined
    ]);
  });
  it(`invalid url "4"`, () => {
    const checker = V.url;
    const result = checker('4');
    expect(result).to.deep.equal([undefined, 'Invalid URL: 4', undefined]);
  });
});
