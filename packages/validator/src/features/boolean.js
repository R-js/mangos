

const { features } = require('./dictionary');

features.set('boolean', {
    factory: 0,
    name: 'boolean',
    fn: a => {
        if (typeof a === 'boolean'){
            return [a, undefined];
        }
        return [undefined, `not a boolean value:${JSON.stringify(a)}`];
    }
});

