
const createRangeCheck = require('../createStringLengthRangeCheck');

const { features } = require('./dictionary');

features.set('string', {
    factory: 1,
    name: 'string',
    fn: createRangeCheck
});







