const fullTypeArrayCheck = require('./array-type-check');

module.exports = collection => fullTypeArrayCheck( n => typeof n, 'number', collection);