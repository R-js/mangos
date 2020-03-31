const { features } = require('./dictionary');
const { lexPath } = require('@mangos/filepath');


features.set('filepath', {
  factory: 1,
  name: 'filepath',
  fn: function (options = {}) {
    return function checkPath(path) {
      const result = lexPath(path, options);
      // result can be undefined, no match was possible
      if (result === undefined) {
        return [[path], `could not lex filepath`, true];
      }
      let allErrors
      if (result.firstError) {
        allErrors = result.path.filter(t => t.error).join('|');
      }
      return [[result.path.map(t => t.value).join(''), result.type], allErrors];
    }
  }
});

