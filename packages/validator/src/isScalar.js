const scalars = [
    'string',
    'number',
    'symbol',
    'boolean'
];

module.exports = function isScalar(s) {
    return scalars.includes(typeof s);
};
