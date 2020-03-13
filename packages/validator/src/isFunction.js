module.exports = function isFunction(f){
    if (typeof f === 'function') {
        const str = f.toString();
        if (str.startsWith('function') || /^\(([^)(]*)\)\s*=>\s*/.test(str)) {
            return true;
        }
    }
    return false;
};