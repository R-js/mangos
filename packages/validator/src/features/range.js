
const { features } = require('./dictionary');
const createRangeCheck = require('../createRangeCheck');

features.set('range', {
    factory: 1,
    name: 'range',
    fn: createRangeCheck
});

