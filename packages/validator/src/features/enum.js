const createFind = require('../createFind');

const { features } = require('./dictionary');

features.set('enum', {
    factory: 1,
    name: 'enum',
    fn: createFind
});