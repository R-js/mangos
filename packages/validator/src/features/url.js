const { features } = require('./dictionary');
const { URL } = require('url');

features.set('url', {
  factory: 0,
  name: 'url',
  fn: url => {
    try {
      const parsed = new URL(url);
      return [[url, parsed ], undefined, undefined]
    } catch (err) {
      return [undefined, err.message, undefined]
    }
  }
});
