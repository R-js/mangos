module.exports = function ifLengthZero(data){
    if (Array.isArray(data) && data.length){
        return data;
    }
    return undefined;
}