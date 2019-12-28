

const isRegExp = require('../isRegExp');

const { features } = require('./dictionary');

features.set('regexp', {
    factory: 0,
    name: 'regexp',
    fn: o => {
        if (isRegExp(o)) {
            return [o, undefined];
        }
        return [undefined, 'not a regexp'];
    }
});
