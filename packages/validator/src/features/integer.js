const createRangeCheck = require('../createRangeCheck');

const { features } = require('./dictionary');

features.set('integer', {
    factory: 1,
    name: 'integer',
    fn: createRangeCheck(true)
});