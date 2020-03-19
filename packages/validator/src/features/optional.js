
const { features } = require('./dictionary');

features.set('optional', {
    factory: 0,
    name: 'optional',
    fn: (o) => [o, undefined, !o],
    final: true
});

