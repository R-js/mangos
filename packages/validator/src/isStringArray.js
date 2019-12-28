const fullTypeArrayCheck = require('./array-type-check');

const isStringArray = collection => fullTypeArrayCheck(str => typeof str, 'string', collection);

module.exports = isStringArray; 