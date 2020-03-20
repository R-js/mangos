// literal object comparison, not to 
const { equals } = require('./equals');


module.exports = function createFind(objArr) {
    if (!Array.isArray(objArr)){
        throw new TypeError('argument "objArr" needs to be an array')
    }
    if (objArr.length === 0){
        throw new TypeError('argument "objArr" cannot be an empty array');
    } 
    return function find(data){
        for (const obj of objArr){
            if (equals(obj, data)){
                return [[data], undefined];
            }
        }
        return [undefined, `"${String(data)}" not found in list`];   
    };
};
