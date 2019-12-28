
const createRangeCheck = require('../createRangeCheck');

const { features } = require('./dictionary');

features.set('number', {
    factory: 1,
    name: 'number',
    fn: createRangeCheck()
});
