const fullTypeArrayCheck = require('./array-type-check');

const isBooleanArray = collection => fullTypeArrayCheck( n => typeof n, 'boolean', collection);

module.exports=isBooleanArray;
