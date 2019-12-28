'use strict';
const regxpNormalisation = /^\(([^\)\(]*)\)\s*=>\s*/;

module.exports = function equalFunction(f1, f2) {
    const str1 = f1.toString().replace(regxpNormalisation,'$1=>');
    const str2 = f2.toString().replace(regxpNormalisation,'$1=>');
    return str1 === str2;
};
