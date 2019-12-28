
module.exports = function isClass(c) {
    return typeof c === 'function' && c.toString().startsWith('class');
};
