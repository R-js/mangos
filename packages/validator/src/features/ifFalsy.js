
const { features } = require('./dictionary');

features.set('ifFalsy', {
    factory: 1,
    name: 'ifFalsy',
    fn: defaultValue => data => { return data ? [data, undefined] : [defaultValue, undefined]; }
});
