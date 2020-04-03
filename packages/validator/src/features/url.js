const { features } = require('./dictionary');
const { URL } = require('url');

features.set('url', {
  factory: 0,
  name: 'url',
  fn: url => {
    try {
      const u = new URL(url);
      // It uses symbols in node, but in browser (chrome) it doesnt,
      // in chrome, props are not queriable with getOwnPropertyDescriptors,
      // nor with getOwnPropertySymbols
      // nor with getOwnPropertyNames
      // 
      // so only workable solution for both is be explicit in grabbing props
      const { href, origin, protocol, username, password, host, hostname, port, pathname, search, hash } = u;
      const o = { 
         href,
         origin,
         protocol,
         username,
         password,
         host,
         hostname,
         port,
         pathname,
         search,
         hash,
         searchParams:{}
      };
      Array.from(u.searchParams.entries()).reduce((obj,[k,v])=>{ 
        obj[k]=v;
        return obj;
      }, o);
      return [[url, o], undefined, undefined];
      
    } catch (err) {
      return [undefined, err.message, undefined]
    }
  }
});
